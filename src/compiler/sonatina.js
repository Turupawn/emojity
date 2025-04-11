var blocks = new Map()
var labelTypes = new Map()
var sonatinaVariableCounter = 0
var sonatinaBlockCounter = 0
var lastCurrentBlock = null //TODO: REMOVE THIS // TODO: remember why I should remove this
var returnValuesUsed = new Set();

// Utility
function solidityTypeToSonatinaType(solidityType) {
  let type = ""
  switch(solidityType) {
    case "bool":
      type = "i1"
      break;
    case "string":
        type = "i256"
        break;
    case "uint8":
        type = "u8"
        break;
    case "uint256":
      type = "i256"
      break;
    case "uint":
        type = "i256"
        break;
    case "uint32":
      type = "i32"
      break;
    case "address":
        type = "i128"
        break;
    case "mapping":
        type = "i256"
        break;
    default:
      type = solidityType
  }
  return type
}

function sonatinaTypeToSize(type) {
  let size = 32n
  switch(type) {
    case "i256":
      size = 32n
      break;
    case "i128":
        size = 20n
        break;
    default:
      size = 32n
  }
  return size
}

function nextValue()
{
  let returnValue = sonatinaVariableCounter
  sonatinaVariableCounter+=1
  return returnValue
}

function nextBlock()
{
  let returnBlock = sonatinaBlockCounter
  sonatinaBlockCounter+=1
  return returnBlock
}

function initSonatinaFunction()
{
  blocks = new Map()
  labelTypes = new Map()
  sonatinaVariableCounter = 0
  sonatinaBlockCounter = 0
}

function labelToValue(label, block) {
  while(block != null && blocks.get(block).labelValues.has(label) != true)
  {
    block = blocks.get(block).dominantBlock
  }
  if(block == null) {
    console.log("Error: Could not find SSA value for " + label)
  }
  let value = blocks.get(block).labelValues.get(label).value
  let type = blocks.get(block).labelValues.get(label).type
  return {value: value, type: type}
}

function rValueToString(value, type) {
  if(typeof value != 'bigint')
    return `v${value}`;
  else
    return `${value}.${type}`
}

function processPhiAssignments(destinationBlock, originBlockA, originBlockB) {
  let returnValue = ""
  for (const [label, value] of labelTypes.entries()) {
    let phiValueA = labelToValue(label, originBlockA)
    let phiValueB = labelToValue(label, originBlockB)
    if(phiValueA.value != phiValueB.value)
    {
      let value = nextValue()
      let type = labelTypes.get(label)
      blocks.get(destinationBlock).labelValues.set(label, {value: value, type: labelTypes.get(label)})
      returnValue += `    v${value}.${type} = phi (${rValueToString(phiValueA.value, phiValueA.type)} block${originBlockA}) (${rValueToString(phiValueB.value, phiValueB.type)} block${originBlockB});\n`
    }
  }
  return returnValue
}

function loadRValue(rvalue, block) {
  let returnValue = null
  let type = null
  let sonatinaCodeAdded = null
  if(rvalue.length > 1) {
    let mappingPositionValue = getMappingPositionValue(rvalue[0], rvalue[1], block)
    sonatinaCodeAdded = mappingPositionValue.sonatinaCodeAdded
    returnValue = mappingPositionValue.value
    type = mappingPositionValue.type
  } else if(typeof rvalue == "bigint") {
    returnValue = rvalue
    type = "i256"
  } else if(rvalue[0] == '👤') {
    returnValue = nextValue()
    type = "i128"
    sonatinaCodeAdded = `    v${returnValue}.${type} = evm_caller;\n`
  } else if(rvalue[0] == '👇') {
    returnValue = nextValue()
    type = "i256"
    sonatinaCodeAdded = `    v${returnValue}.${type} = evm_address;\n`
  } else if(rvalue[0] == '💰') {
    returnValue = nextValue()
    type = "i256"
    sonatinaCodeAdded = `    v${returnValue}.${type} = evm_callvalue;\n`
  } else if(stateVariables.has(rvalue[0])) {
    type = solidityTypeToSonatinaType(stateVariables.get(rvalue[0]).type)
    if(blocks.get(block).dominantBlock != null && blocks.get(blocks.get(block).dominantBlock).optimizableVariables != null
      && blocks.get(blocks.get(block).dominantBlock).optimizableVariables.has(rvalue[0])) {
      returnValue = blocks.get(blocks.get(block).dominantBlock).optimizableVariables.get(rvalue[0]).value
    } else {
      returnValue = nextValue()
      sonatinaCodeAdded = `    v${returnValue}.${type} = evm_sload $${stateVariables.get(rvalue[0]).description};\n`
    }
  } else {
    returnValue = labelToValue(rvalue[0], block).value
    type = labelToValue(rvalue[0], block).type
  }
  return {value: returnValue, type: type, sonatinaCodeAdded: sonatinaCodeAdded}
}

function storeLValue(lvalueLabel, rvalue, block) {
  let type = null
  let sonatinaCodeAdded = ""
  if(stateVariables.has(lvalueLabel[0])) {
    if(lvalueLabel.length > 1) {
      type = "i256"
      let mappingPositionValue = getMappingPositionValue(lvalueLabel[0], lvalueLabel[1], block)
      sonatinaCodeAdded += mappingPositionValue.sonatinaCodeAdded
      sonatinaCodeAdded += `    evm_sstore v${mappingPositionValue.value} ${rValueToString(rvalue.value, rvalue.type)};\n`
    } else {
      type = solidityTypeToSonatinaType(stateVariables.get(lvalueLabel[0]).type)
      if(blocks.get(block).dominantBlock != null && blocks.get(blocks.get(block).dominantBlock).optimizableVariables != null
        && blocks.get(blocks.get(block).dominantBlock).optimizableVariables.has(lvalueLabel[0])) {
        blocks.get(blocks.get(block).dominantBlock).optimizableVariables.get(lvalueLabel[0]).value = rvalue.value
      } else {
        sonatinaCodeAdded += `    evm_sstore $${stateVariables.get(lvalueLabel[0]).description} ${rValueToString(rvalue.value, rvalue.type)};\n`
      }
    }
  } else {
    // TODO: Handle memory storage?
    // TODO: Make sure we don't need to handle calldata storage
    let value = rvalue.value
    let type = rvalue.type
    if(typeof rvalue.value == 'bigint') {
      //value = nextValue()
      //type = labelTypes.get(lvalueLabel[0])
      //sonatinaCodeAdded += `    v${value}.${type} = ${rvalue.value}.${rvalue.type};\n`;
    }
    blocks.get(block).labelValues.set(lvalueLabel[0], {value: value, type: type})
  }
  return {sonatinaCodeAdded: sonatinaCodeAdded, type: type}
}

function getMappingPositionValue(mappingLabel, keyLabel, block) {
  let sonatinaCodeAdded = ""
  let mappingKeyLoadValue = loadRValue([keyLabel], block)
  let returnValue = nextValue()
  let type = "i256"
  if(mappingKeyLoadValue.sonatinaCodeAdded != null) {
    sonatinaCodeAdded += mappingKeyLoadValue.sonatinaCodeAdded
  }
  let keccackOffsetValue = nextValue()
  let keccackKeyValue = nextValue()
  sonatinaCodeAdded += `    v${keccackOffsetValue}.i256 = evm_malloc 64.i256;\n`
  sonatinaCodeAdded += `    v${keccackKeyValue}.i256 = add v${keccackOffsetValue} 32.i256;\n`
  sonatinaCodeAdded += `    evm_mstore v${keccackOffsetValue} v${mappingKeyLoadValue.value};\n`
  sonatinaCodeAdded += `    evm_mstore v${keccackKeyValue} $${stateVariables.get(mappingLabel).description};\n`
  sonatinaCodeAdded += `    v${returnValue}.${type} = evm_keccak256 v${keccackOffsetValue} 64.i256;\n`
  return {value: returnValue, type: type, sonatinaCodeAdded: sonatinaCodeAdded}
}

// prebuilt code
function getUintReturnCode() {
  return `func private %returnUint(v0.i256) {
block0:
  v1.i256 = evm_malloc 32.i256;
  evm_mstore v1 v0;
  evm_return v1 32.i256;
}
`
}

function getAddressReturnCode() {// TODO: Check if this produces correct byte shifting with SLL
  return `func private %returnAddress(v0.i128) {
block0:
  v1.i256 = evm_malloc 20.i256;
  v2.i256 = srl 96.i256 v0;
  evm_mstore v1 v2;
  evm_return v1 20;
}
`
}

function getBoolReturnCode() {// TODO: Check if this produces correct byte shifting with SLL
  return `func private %returnBool(v0.i1) {
block0:
  v1.i256 = evm_malloc 1.i256;
  v2.i256 = srl 248.i256 v0;
  evm_mstore v1 v2;
  evm_return v1 1.i256;
}
`
}

function getStringReturnCode() {// TODO: In Sonatina, should I threat string as i256? // TODO: Should I pad the string with SLL? // TODO: How to get the length? // TODO: Accept strings longer than 32 bytes
  return `func private %returnString(v0.i256) {
block0:
  v1.i256 = evm_malloc 32.i256;
  v2.i256 = evm_malloc 32.i256;
  v3.i256 = evm_malloc 32.i256;

  evm_mstore v1 v2;
  evm_mstore v2 32.i256;
  evm_mstore v3 v0;

  evm_mstore v1 v0;
  evm_return v1 96.i256;
}
`
}

function createMainFunction() {
  let sonatinaCodeAdded = ""
  sonatinaCodeAdded += `func public %main() {\n`
  sonatinaCodeAdded += `  block0:\n`
  sonatinaCodeAdded += `    v0.i256 = evm_contract_size %constructor;\n`
  sonatinaCodeAdded += `    v1.i256 = evm_contract_size %entrypoint;\n`
  sonatinaCodeAdded += `    v2.i256 = add v0 v1;\n`
  sonatinaCodeAdded += `    v3.i256 = get_function_ptr %entrypoint;\n`
  sonatinaCodeAdded += `    evm_codecopy 0.i256 v2 v2;\n`
  sonatinaCodeAdded += `}\n\n`
  return sonatinaCodeAdded
}

function createConstructor() {
  initSonatinaFunction()
  blocks.set(0, {labelValues: new Map(), optimizableVariables: new Map(),  dominantBlock: null, returnType: null})
  let sonatinaCodeAdded = ""
  sonatinaCodeAdded += `func private %constructor() {\n`
  sonatinaCodeAdded += compileBlock(constructorInstructions, nextBlock())
  sonatinaCodeAdded += `}\n\n`
  return sonatinaCodeAdded
}

// Main function
function compileToSonatina(unicodeCodePoints) {
  prepareCompilation(unicodeCodePoints)
  parse()

  returnValuesUsed = new Set();
  let sonatinaCode = ""

  for (const [label, value] of stateVariables.entries()) {
    let type = solidityTypeToSonatinaType(stateVariables.get(label).type)
    sonatinaCode += `global private const *${type} $${stateVariables.get(label).description} = ${stateVariables.get(label).position};\n`
  }

  if(sonatinaCode != "")
    sonatinaCode += "\n"

  sonatinaCode += createMainFunction()
  sonatinaCode += createConstructor()

  sonatinaCode += `func public %entrypoint() {\n`
  sonatinaCode += `  block0:\n`
  sonatinaCode += `    v${nextValue()}.i256 = evm_call_data_load 0.i256;\n`
  sonatinaCode += `    v${nextValue()}.i256 = shr v0 224.i256;\n`
  sonatinaCode += `    br_table v1 block1`
  for(let i=0; i<functions.length; i++)
  {
    let signature = getSelector(getFunctionSignature(functions[i].name, functions[i].parameters)).substring(0, 8).toUpperCase()
    sonatinaCode += ` (0x${signature}.i32 block${(i+2)})`
  }
  sonatinaCode += `;\n`

  for(let i=0; i<functions.length; i++)
  {
    sonatinaCode += `  block${(i+2)}:\n`

    let values = []
    for(let j=0; j<functions[i].parameters.length; j++) {
      values.push(nextValue())
    }

    for(let j=0; j<functions[i].parameters.length; j++) {
      sonatinaCode += `    v${values[j]}.i256 = evm_call_data_load ${j+1}.i8;\n`
    }
    let functionType = solidityTypeToSonatinaType(functions[i].returnType)
    let functionTypeValue = nextValue()
    sonatinaCode += `    v${functionTypeValue}.${functionType} = call %${functions[i].name}`
    for(let j=0; j<functions[i].parameters.length; j++) {
      sonatinaCode += ` v${values[j]}`
    }
    sonatinaCode += `;\n`

    switch(functionType) {
      case "i256":
        returnValuesUsed.add("uint")
        sonatinaCode += `    call %returnUint v${functionTypeValue};\n`
        break;
      case "i128":
        returnValuesUsed.add("address")
        sonatinaCode += `    call %returnAddress v${functionTypeValue};\n`
          break;
      case "bool":
        returnValuesUsed.add("bool")
        sonatinaCode += `    call %returnBool v${functionTypeValue};\n`
        break;
      default:
        returnValuesUsed.add("uint")
        sonatinaCode += `    call %returnUint v${functionTypeValue};\n`// TODO: Should this be handled?
    }
  }
  
  sonatinaCode += `  block1:\n`
  sonatinaCode += `    evm_revert 0.i256 0.i256;\n`
  sonatinaCode += `}\n\n`

  for(let i=0; i<functions.length; i++)
  {
    initSonatinaFunction()

    blocks.set(0, {labelValues: new Map(), optimizableVariables: new Map(),  dominantBlock: null, returnType: functions[i].returnType})

    sonatinaCode += "func private %" + functions[i].name
    sonatinaCode += "("
    for(let j=0; j<functions[i].parameters.length; j++) {
      let value = nextValue()
      let type = solidityTypeToSonatinaType(functions[i].parameters[j].type)
      sonatinaCode += "v"+value+"."+type
      if(j+1<functions[i].parameters.length) {
        sonatinaCode += ", "
      }
      blocks.get(0).labelValues.set(functions[i].parameters[j].label, { value: value, type: type})
      labelTypes.set(functions[i].parameters[j].label, type)
    }
    sonatinaCode += ")"
    if(functions[i].returnType)
      sonatinaCode += " -> " + solidityTypeToSonatinaType(functions[i].returnType) + " "
    sonatinaCode += "{\n"
    sonatinaCode += compileBlock(functions[i].instructions, nextBlock())
    sonatinaCode += "}\n\n"
  }
  for(let i=0; i<functions.length; i++)
  {
      functionLogic(functions[i].jumpDestination, functions[i])
  }

  if(returnValuesUsed.has("uint")) {
    sonatinaCode += getUintReturnCode()
  } else if(returnValuesUsed.has("address")) {
    sonatinaCode += getAddressReturnCode()
  } else if(returnValuesUsed.has("bool")) {
    sonatinaCode += getBoolReturnCode()
  }

  return sonatinaCode
}

function checkSSTOREOptimizations(instructions) {
  let optimizableVariables = new Set()
  for (const [label, value] of stateVariables.entries()) {
    let labelIsUsed = false
    let blockIsOptimizable = true
    for(let i=0; i<instructions.length; i++) {
      let instruction = instructions[i]
      if((instruction.name == "operation" && instruction.lValue[0] == label)
        || (instruction.name == "assignment" && instruction.lValue[0] == label)
        || (instruction.name == "literalAssignment" && instruction.lValue[0] == label)
      )
      {
        labelIsUsed = true
      }
      if(instruction.name == "ifStatement" || instruction.name == "whileLoop" || instruction.name == "externalCall") {
        blockIsOptimizable = false
      }
    }
    if(labelIsUsed && blockIsOptimizable)
    {
      optimizableVariables.add(label)
    }
  }
  return optimizableVariables
}

function compileBlock(instructions, currentBlock, /* optional */ parrentBlock) {
  if(parrentBlock != null)
    blocks.set(currentBlock, {labelValues: new Map(), optimizableVariables: new Map(),  dominantBlock: parrentBlock, returnType: blocks.get(parrentBlock).returnType})
  let compiledSonatinaInstructions = "  block" + currentBlock + ":\n"

  for(let i=0; i<instructions.length; i++) {
    if(instructions[i].name == "operation")
    {
      let rlValueLoad = loadRValue(instructions[i].rlValue, currentBlock)
      if(rlValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += rlValueLoad.sonatinaCodeAdded
      let sonatinaRLValue = `${rlValueLoad.value}`
      if(typeof rlValueLoad.value != "bigint")
        sonatinaRLValue = `v${rlValueLoad.value}`
      else
        sonatinaRLValue = `${rlValueLoad.value}.${rlValueLoad.type}`

      let rrValueLoad = loadRValue(instructions[i].rrValue, currentBlock)
      if(rrValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += rrValueLoad.sonatinaCodeAdded
      let sonatinaRRValue = ""
      if(typeof rrValueLoad.value != "bigint")
        sonatinaRRValue = `v${rrValueLoad.value}`
      else
        sonatinaRRValue = `${rrValueLoad.value}.${rrValueLoad.type}`

      let operator = ""
      switch(instructions[i].operator) {
        case '➕':
          operator = "add"
          break;
        case '➖':
          operator = "sub"
          break;
        case '✖️':
          operator = "mul"
          break;
        case '➗':
          operator = "div"
          break;
        case '⬆️':
          operator = "gt"
          break;
        case '⬇️':
          operator = "lt"
          break;
        case '🟰':
          operator = "eq"
          break;
        default:
          console.log("Error: could not find operator")
      }

      let value = nextValue()
      compiledSonatinaInstructions += `    v${value}.${rlValueLoad.type} = ${operator} ${sonatinaRLValue} ${sonatinaRRValue};\n`
      let storeLValueCode = storeLValue(instructions[i].lValue, {value: value, type: rlValueLoad.type}, currentBlock)
      compiledSonatinaInstructions += storeLValueCode.sonatinaCodeAdded
    } else if(instructions[i].name == "return")
    {
      if(typeof instructions[i].value != 'bigint')
      {
        let returnValueLoad = loadRValue(instructions[i].value, currentBlock)
        if(returnValueLoad.sonatinaCodeAdded != null)
          compiledSonatinaInstructions += returnValueLoad.sonatinaCodeAdded
        compiledSonatinaInstructions += `    return ${rValueToString(returnValueLoad.value, returnValueLoad.type)};\n`
      } else {
        let type = solidityTypeToSonatinaType(blocks.get(currentBlock).returnType)
        compiledSonatinaInstructions += `    return ${instructions[i].value}.${type};\n`;
      }
    } else if(instructions[i].name == "assignment")
    {
      let rValueLoad = loadRValue(instructions[i].rValue, currentBlock)
      if(rValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += rValueLoad.sonatinaCodeAdded
      let storeLValueCode = storeLValue(instructions[i].lValue, {value: rValueLoad.value, type: rValueLoad.type}, currentBlock)
      compiledSonatinaInstructions += storeLValueCode.sonatinaCodeAdded
    } else if(instructions[i].name == "literalAssignment")
    {
      let storeLValueCode = storeLValue(instructions[i].lValue, {value: instructions[i].rValue, type: "i256"}, currentBlock)
      compiledSonatinaInstructions += storeLValueCode.sonatinaCodeAdded
    } else if(instructions[i].name == "logEvent")
    {
      let memoryOffsetValue = nextValue()
      let eventSignature = getEmojiDescription(instructions[i].topics[0][0]) + getEmojiDescription(instructions[i].topics[0][1])
      eventSignature = functionNameConversor(convertToFunctionName(eventSignature))
      let eventSignatureHash = getSelector(eventSignature).toUpperCase()
      compiledSonatinaInstructions += `    v${memoryOffsetValue}.i256 = evm_malloc 32.i256;\n`
      compiledSonatinaInstructions += `    evm_mstore v${memoryOffsetValue} 0x${eventSignatureHash}.i256;\n`
      let topics = ""
      for(let j=1; j<instructions[i].topics.length; j++) {
        let topicLoad = loadRValue(instructions[i].topics[j], currentBlock)
        if(topicLoad.sonatinaCodeAdded != null)
          compiledSonatinaInstructions += topicLoad.sonatinaCodeAdded
        topics += ` v${topicLoad.value}`
      }
      compiledSonatinaInstructions += `    evm_log${instructions[i].topics.length} v${memoryOffsetValue} 32.i256${topics};\n`;
    } else if(instructions[i].name == "ifStatement")
    {
      let conditionVariable = labelToValue(instructions[i].condition[0], currentBlock)
      let ifTrueBlock = nextBlock()
      let mergeBlock = nextBlock()
      compiledSonatinaInstructions += `    br v${conditionVariable.value} block${ifTrueBlock} block${mergeBlock};\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, ifTrueBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${mergeBlock};\n`
      compiledSonatinaInstructions += `  block${mergeBlock}:\n`

      blocks.set(mergeBlock, {labelValues: new Map(), optimizableVariables: new Map(),  dominantBlock: currentBlock, returnType: blocks.get(currentBlock).returnType})

      compiledSonatinaInstructions += processPhiAssignments(mergeBlock, currentBlock, lastCurrentBlock)
      currentBlock = mergeBlock
    } else if(instructions[i].name == "whileLoop")
    {
      let bodyBlock = nextBlock()
      let conditionBlock = nextBlock()
      let exitBlock = nextBlock()

      let optimizableVariablesLabels = checkSSTOREOptimizations(instructions[i].instructions)

      for (const optimizableVariable of optimizableVariablesLabels) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(optimizableVariable).type)
        compiledSonatinaInstructions += `    v${value}.${type} = evm_sload $${stateVariables.get(optimizableVariable).description};\n`
        blocks.get(currentBlock).optimizableVariables.set(optimizableVariable, {value: value, type: type})
      }

      compiledSonatinaInstructions += `    jump block${conditionBlock};\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, bodyBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${conditionBlock};\n`
      compiledSonatinaInstructions += `  block${conditionBlock}:\n`
      blocks.set(conditionBlock, {labelValues: new Map(), optimizableVariables: new Map(),  dominantBlock: currentBlock, returnType: blocks.get(currentBlock).returnType})
      compiledSonatinaInstructions += processPhiAssignments(conditionBlock, bodyBlock, currentBlock)

      for (const optimizableVariable of optimizableVariablesLabels) {
        let optimizableVariableValue = blocks.get(currentBlock).optimizableVariables.get(optimizableVariable)
        compiledSonatinaInstructions += `    evm_sstore ${rValueToString(optimizableVariableValue.value, optimizableVariableValue.type)};\n`
      }

      let conditionVariable = labelToValue(instructions[i].condition[0], conditionBlock)
      compiledSonatinaInstructions += `    br v${conditionVariable.value} block${bodyBlock} block${exitBlock};\n`
      compiledSonatinaInstructions += `  block${exitBlock}:\n`
      currentBlock = conditionBlock
    } else if(instructions[i].name == "declareUint"
        || instructions[i].name == "declareAddress" // TODO: Should we differentiate types?
        || instructions[i].name == "declareString"
        || instructions[i].name == "declareBool"
    )
    {
      //let value = nextValue()
      let type = solidityTypeToSonatinaType(instructions[i].type)
      blocks.get(currentBlock).labelValues.set(instructions[i].label[0], { value: 0n, type: type})
      labelTypes.set(instructions[i].label[0], type)
      //compiledSonatinaInstructions += `    v${value}.${type} = 0.${type};\n` // TODO: Is it ok skip declarations?
    } else if(instructions[i].name == "externalCall")
    {
      let gasLoadedValue = loadRValue(instructions[i].gas.value, currentBlock)
      if(gasLoadedValue.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += gasLoadedValue.sonatinaCodeAdded
      let gas = `v${gasLoadedValue.value}`

      let contractAddressLoadedValue = loadRValue(instructions[i].contractAddress.value, currentBlock)
      if(contractAddressLoadedValue.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += contractAddressLoadedValue.sonatinaCodeAdded
      let contractAddress = `v${contractAddressLoadedValue.value}`

      let callValueLoadedValue = loadRValue(instructions[i].value.value, currentBlock)
      if(callValueLoadedValue.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += callValueLoadedValue.sonatinaCodeAdded
      let callValue = `v${callValueLoadedValue.value}`

      let argsOffsetValue = null
      let argsOffset = null
      let argsSize = 0n
      for(let j=0; j<instructions[i].params.length; j++) {
        let paramLoad = loadRValue(instructions[i].params[j].value, currentBlock)
        if(paramLoad.sonatinaCodeAdded != null)
          compiledSonatinaInstructions += paramLoad.sonatinaCodeAdded
        let param = `v${paramLoad.value}`

        if(instructions[i].params[j].type == "literal") {
          argsSize += 32n
        } else if(stateVariables.has(instructions[i].params[j].value[0])) {
          let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].params[j].value[0]).type)
          argsSize += sonatinaTypeToSize(type)
        } else if(instructions[i].params[j].value[0] == '👤') {
          argsSize += 20n
        } else if(instructions[i].params[j].value[0] == '👇' || instructions[i].params[j].value[0] == '💰') {
          argsSize += 32n
        } else {
          argsSize += sonatinaTypeToSize(labelTypes.get(instructions[i].params[j].value[0]))
        }
        let value = nextValue()
        if(argsOffsetValue == null) {
          argsOffsetValue = value
        }

        compiledSonatinaInstructions += `    v${value}.i256 = evm_malloc 32.i256;\n`
        compiledSonatinaInstructions += `    mstore v${value} ${param};\n`
      }

      if(argsOffsetValue == null) {
        argsOffset = `0.i256`
      } else{
        argsOffset = `v${argsOffsetValue}`
      }

      let callResultValue = nextValue()
      let successBlock = nextBlock()
      let revertBlock = nextBlock()
      compiledSonatinaInstructions += `    v${callResultValue}.i256 = evm_call ${gas} ${contractAddress} ${callValue} ${argsOffset} ${argsSize}.i256 0.i256 0.i256;\n`;
      compiledSonatinaInstructions += `    br v${callResultValue} block${successBlock} block${revertBlock};\n`
      compiledSonatinaInstructions += `  block${revertBlock}:\n`
      compiledSonatinaInstructions += `    evm_revert 0.i256 0.i256;\n`// TODO: call a %revert instead of this
      compiledSonatinaInstructions += `  block${successBlock}:\n`
      blocks.set(successBlock, {labelValues: new Map(), optimizableVariables: new Map(),  dominantBlock: currentBlock, returnType: blocks.get(currentBlock).returnType})
      currentBlock = successBlock 
    } else if(instructions[i].name == "revert")
    {
      compiledSonatinaInstructions += `    evm_revert 0.i256 0.i256;\n`;
    }
  }
  lastCurrentBlock = currentBlock
  return compiledSonatinaInstructions
}