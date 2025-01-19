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
        type = "i160"
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
    case "i160":
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

function processPhiAssignments(destinationBlock, originBlockA, originBlockB) {
  let returnValue = ""
  for (const [label, value] of labelTypes.entries()) {
    let phiValueA = labelToValue(label, originBlockA)
    let phiValueB = labelToValue(label, originBlockB)
    let value = nextValue()
    let type = labelTypes.get(label)
    blocks.get(destinationBlock).labelValues.set(label, {value: value, type: labelTypes.get(label)})
    if(phiValueA != phiValueB)
      returnValue += `    v${value}.${type} = phi (${typeof phiValueA.value != 'bigint' ? 'v' : ''}${phiValueA.value}.${phiValueA.type} block${originBlockA}) (${typeof phiValueB.value != 'bigint' ? 'v' : ''}${phiValueB.value}.${phiValueB.type} block${originBlockB});\n`
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
    type = "i160"
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
    returnValue = nextValue()
    type = solidityTypeToSonatinaType(stateVariables.get(rvalue[0]).type)
    sonatinaCodeAdded = `    v${returnValue}.${type} = evm_sload $${stateVariables.get(rvalue[0]).description};\n`
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
      sonatinaCodeAdded += `    evm_sstore v${mappingPositionValue.value}.${mappingPositionValue.type} ${typeof rvalue.value != 'bigint' ? 'v' : ''}${rvalue.value}.${rvalue.type};\n`
    } else {
      type = solidityTypeToSonatinaType(stateVariables.get(lvalueLabel[0]).type)
      sonatinaCodeAdded += `    evm_sstore $${stateVariables.get(lvalueLabel[0]).description} ${typeof rvalue.value != 'bigint' ? 'v' : ''}${rvalue.value}.${rvalue.type};\n`
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
  sonatinaCodeAdded += `    v${keccackKeyValue}.i256 = add v${keccackOffsetValue}.i256 32.i256;\n`
  sonatinaCodeAdded += `    evm_mstore v${keccackOffsetValue}.i256 v${mappingKeyLoadValue.value}.${mappingKeyLoadValue.type};\n`
  sonatinaCodeAdded += `    evm_mstore v${keccackKeyValue}.i256 $${stateVariables.get(mappingLabel).description};\n`
  sonatinaCodeAdded += `    v${returnValue}.${type} = evm_keccak256 v${keccackOffsetValue}.i256 64.i256;\n`
  return {value: returnValue, type: type, sonatinaCodeAdded: sonatinaCodeAdded}
}

// prebuilt code
function getUintReturnCode() {
  return `func %returnUint(v0.i256) {
  v1.i256 = evm_malloc 32.i256;
  evm_mstore v1.i256 v0.i256;
  return v1.i256 32.i256;
}
`
}

function getAddressReturnCode() {// TODO: Check if this produces correct byte shifting with SLL
  return `func %returnAddress(v0.i160) {
  v1.i256 = evm_malloc 20.i256;
  v2.i256 = srl 96.i256 v0.i160;
  evm_mstore v1.i256 v2.i256;
  evm_return v1.i256 20.i256;
}
`
}

function getBoolReturnCode() {// TODO: Check if this produces correct byte shifting with SLL
  return `func %returnBool(v0.bool) {
  v1.i256 = evm_malloc 1.i256;
  v2.i256 = srl 248.i256 v0.bool;
  evm_mstore v1.i256 v2.i256;
  evm_return v1.i256 1.i256;
}
`
}

function getStringReturnCode() {// TODO: In Sonatina, should I threat string as i256? // TODO: Should I pad the string with SLL? // TODO: How to get the length? // TODO: Accept strings longer than 32 bytes
  return `func %returnString(v0.i256) {
  v1.i256 = evm_malloc 32.i256;
  v2.i256 = evm_malloc 32.i256;
  v3.i256 = evm_malloc 32.i256;

  evm_mstore v1.i256 v2.i256;
  evm_mstore v2.i256 32.i256;
  evm_mstore v3.i256 v0.256;

  evm_mstore v1.i256 v0.i256;
  return v1.i256 96.i256;
}
`
}

function createMainFunction() {
  let sonatinaCodeAdded = ""
  sonatinaCodeAdded += `func %main() {\n`
  sonatinaCodeAdded += `  block0:\n`
  sonatinaCodeAdded += `    v0.i256 = function_size %constructor\n`
  sonatinaCodeAdded += `    v1.i256 = function_size %entrypoint\n`
  sonatinaCodeAdded += `    evm_codecopy 0.i256 v0.i256 v1.i256\n`
  sonatinaCodeAdded += `}\n\n`
  return sonatinaCodeAdded
}

function createConstructor() {
  initSonatinaFunction()
  let sonatinaCodeAdded = ""
  sonatinaCodeAdded += `func %constructor() {\n`
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
    sonatinaCode += `global private *${type} $${stateVariables.get(label).description} = ${stateVariables.get(label).position};\n`
  }

  if(sonatinaCode != "")
    sonatinaCode += "\n"

  sonatinaCode += createMainFunction()
  sonatinaCode += createConstructor()

  sonatinaCode += `func %entrypoint() {\n`
  sonatinaCode += `  block0:\n`
  sonatinaCode += `    v${nextValue()}.i256 = evm_call_data_load 0.i256;\n`
  sonatinaCode += `    v${nextValue()}.i256 = shr v0 224.i256;\n`
  sonatinaCode += `    br_table v1 block1;`
  for(let i=0; i<functions.length; i++)
  {
    let signature = getSelector(getFunctionSignature(functions[i].name, functions[i].parameters)).substring(0, 8).toUpperCase()
    sonatinaCode += ` (0x${signature} block${(i+2)})`
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
        sonatinaCode += `    call %returnUint(v${functionTypeValue}.i256)\n`
        break;
      case "i160":
        returnValuesUsed.add("address")
        sonatinaCode += `    call %returnAddress(v${functionTypeValue}.i160)\n`
          break;
      case "bool":
        returnValuesUsed.add("bool")
        sonatinaCode += `    call %returnBool(v${functionTypeValue}.bool)\n`
        break;
      default:
        returnValuesUsed.add("uint")
        sonatinaCode += `    call %returnUint(v${functionTypeValue}.i256)\n`// TODO: Should this be handled?
    }
  }
  
  sonatinaCode += `  block1:\n`
  sonatinaCode += `    evm_revert 0.i256 0.i256;\n`
  sonatinaCode += `}\n\n`

  for(let i=0; i<functions.length; i++)
  {
    initSonatinaFunction()

    blocks.set(0, {labelValues: new Map(),  dominantBlock: null})

    sonatinaCode += "func %" + functions[i].name
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
  let optimizableVariables = []
  for (const [label, value] of stateVariables.entries()) {
    for(let i=0; i<instructions.length; i++) {
      let instruction = instructions[i]
      if(instruction.name == "operation" &&
          instruction.lValue[0] == label
      )
      {
        optimizableVariables.push(label)
      }
    }
  }
  return optimizableVariables
}

function compileBlock(instructions, currentBlock, /* optional */ parrentBlock, optimizableVariables) {
  if(parrentBlock != null)
    blocks.set(currentBlock, {labelValues: new Map(),  dominantBlock: parrentBlock})
  let compiledSonatinaInstructions = "  block" + currentBlock + ":\n"

  for(let i=0; i<instructions.length; i++) {
    if(instructions[i].name == "operation")
    {
      let rlValueLoad = loadRValue(instructions[i].rlValue, currentBlock)
      if(rlValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += rlValueLoad.sonatinaCodeAdded
      let sonatinaRLValue = `${rlValueLoad.value}.${rlValueLoad.type}`
      if(typeof rlValueLoad.value != "bigint")
        sonatinaRLValue = `v${sonatinaRLValue}`

      let rrValueLoad = loadRValue(instructions[i].rrValue, currentBlock)
      if(rrValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += rrValueLoad.sonatinaCodeAdded
      let sonatinaRRValue = `${rrValueLoad.value}.${rrValueLoad.type}`
      if(typeof rrValueLoad.value != "bigint")
        sonatinaRRValue = `v${sonatinaRRValue}`

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
    }else if(instructions[i].name == "returnLiteral") // TODO: Unify ReturnLabel and ReturnLiteral
    {
      let literal = instructions[i].value
      let type = solidityTypeToSonatinaType(instructions[i].returnType)
      compiledSonatinaInstructions += `    return ${literal}.${type};\n`;
    }else if(instructions[i].name == "returnLabel")
    {
      let returnValueLoad = loadRValue(instructions[i].value, currentBlock)
      if(returnValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += returnValueLoad.sonatinaCodeAdded
      compiledSonatinaInstructions += `    return v${returnValueLoad.value}.${returnValueLoad.type};\n`
    }else if(instructions[i].name == "assignment")
    {
      let rValueLoad = loadRValue(instructions[i].rValue, currentBlock)
      if(rValueLoad.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += rValueLoad.sonatinaCodeAdded
      let storeLValueCode = storeLValue(instructions[i].lValue, {value: rValueLoad.value, type: rValueLoad.type}, currentBlock)
      compiledSonatinaInstructions += storeLValueCode.sonatinaCodeAdded
    }else if(instructions[i].name == "literalAssignment")
    {
      let storeLValueCode = storeLValue(instructions[i].lValue, {value: instructions[i].rValue, type: "i256"}, currentBlock)
      compiledSonatinaInstructions += storeLValueCode.sonatinaCodeAdded
    }else if(instructions[i].name == "logEvent")
    {
      let memoryOffsetValue = nextValue()
      let eventSignature = getEmojiDescription(instructions[i].topics[0][0]) + getEmojiDescription(instructions[i].topics[0][1])
      eventSignature = functionNameConversor(convertToFunctionName(eventSignature))
      let eventSignatureHash = getSelector(eventSignature).toUpperCase()
      compiledSonatinaInstructions += `    v${memoryOffsetValue}.i256 = evm_malloc 32.i256;\n`
      compiledSonatinaInstructions += `    evm_mstore v${memoryOffsetValue}.i256 0x${eventSignatureHash}.i256;\n`
      let topics = ""
      for(let j=1; j<instructions[i].topics.length; j++) {
        let topicLoad = loadRValue(instructions[i].topics[j], currentBlock)
        if(topicLoad.sonatinaCodeAdded != null)
          compiledSonatinaInstructions += topicLoad.sonatinaCodeAdded
        topics += ` v${topicLoad.value}.${topicLoad.type}`
      }
      compiledSonatinaInstructions += `    evm_log${instructions[i].topics.length} v${memoryOffsetValue}.i256 32.i256${topics};\n`;
    }else if(instructions[i].name == "ifStatement")
    {
      let conditionVariable = labelToValue(instructions[i].condition[0], currentBlock)
      let ifTrueBlock = nextBlock()
      let mergeBlock = nextBlock()
      compiledSonatinaInstructions += `    br v${conditionVariable.value}.${conditionVariable.type} block${ifTrueBlock} block${mergeBlock};\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, ifTrueBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${mergeBlock};\n`
      compiledSonatinaInstructions += `  block${mergeBlock}:\n`

      blocks.set(mergeBlock, {labelValues: new Map(),  dominantBlock: currentBlock})

      let ifTrueReturningBlock = lastCurrentBlock

      // Naively add all variables to phi
      for (const [label, value] of labelTypes.entries()) {
        let phiIfTrue = labelToValue(label, ifTrueReturningBlock)
        let phiIfFalse = labelToValue(label, mergeBlock)
        let value = nextValue()
        let type = labelTypes.get(label)
        blocks.get(mergeBlock).labelValues.set(label, {value: value, type: labelTypes.get(label)})
        compiledSonatinaInstructions += `    v${value}.${type} = phi (${typeof phiIfTrue.value != 'bigint' ? 'v' : ''}${phiIfTrue.value}.${phiIfTrue.type} block${ifTrueReturningBlock}) (${typeof phiIfFalse.value != 'bigint' ? 'v' : ''}${phiIfFalse.value}.${phiIfFalse.type} block${currentBlock});\n`
      }
      currentBlock = mergeBlock
    }else if(instructions[i].name == "whileLoop")
    {
      let bodyBlock = nextBlock()
      let conditionBlock = nextBlock()
      let exitBlock = nextBlock()

      let optimizableVariables = checkSSTOREOptimizations(instructions[i].instructions)

      compiledSonatinaInstructions += `    jump block${conditionBlock};\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, bodyBlock, currentBlock, optimizableVariables)
      compiledSonatinaInstructions += `    jump block${conditionBlock};\n`
      compiledSonatinaInstructions += `  block${conditionBlock}:\n`
      blocks.set(conditionBlock, {labelValues: new Map(),  dominantBlock: currentBlock})
      compiledSonatinaInstructions += processPhiAssignments(conditionBlock, bodyBlock, currentBlock)
      let conditionVariable = labelToValue(instructions[i].condition[0], conditionBlock)
      compiledSonatinaInstructions += `    br v${conditionVariable.value}.${conditionVariable.type} block${bodyBlock} block${exitBlock};\n`
      compiledSonatinaInstructions += `  block${exitBlock}:\n`
      currentBlock = conditionBlock
    }else if(instructions[i].name == "declareUint"
        || instructions[i].name == "declareAddress" // TODO: Should we differentiate types?
        || instructions[i].name == "declareString"
        || instructions[i].name == "declareBool"
    )
    {
      let value = nextValue()
      let type = solidityTypeToSonatinaType(instructions[i].type)
      blocks.get(currentBlock).labelValues.set(instructions[i].label[0], { value: value, type: type})
      labelTypes.set(instructions[i].label[0], type)
      compiledSonatinaInstructions += `    v${value}.${type} = 0.${type};\n`
    }else if(instructions[i].name == "externalCall")
    {
      let gasLoadedValue = loadRValue(instructions[i].gas.value, currentBlock)
      if(gasLoadedValue.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += gasLoadedValue.sonatinaCodeAdded
      let gas = `v${gasLoadedValue.value}.${gasLoadedValue.type}`

      let contractAddressLoadedValue = loadRValue(instructions[i].contractAddress.value, currentBlock)
      if(contractAddressLoadedValue.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += contractAddressLoadedValue.sonatinaCodeAdded
      let contractAddress = `v${contractAddressLoadedValue.value}.${contractAddressLoadedValue.type}`

      let callValueLoadedValue = loadRValue(instructions[i].value.value, currentBlock)
      if(callValueLoadedValue.sonatinaCodeAdded != null)
        compiledSonatinaInstructions += callValueLoadedValue.sonatinaCodeAdded
      let callValue = `v${callValueLoadedValue.value}.${callValueLoadedValue.type}`

      let argsOffsetValue = null
      let argsOffset = null
      let argsSize = 0n
      for(let j=0; j<instructions[i].params.length; j++) {
        let paramLoad = loadRValue(instructions[i].params[j].value, currentBlock)
        if(paramLoad.sonatinaCodeAdded != null)
          compiledSonatinaInstructions += paramLoad.sonatinaCodeAdded
        let param = `v${paramLoad.value}.${paramLoad.type}`

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
        compiledSonatinaInstructions += `    mstore v${value}.i256 ${param};\n`
      }

      if(argsOffsetValue == null) {
        argsOffset = `0.i256`
      } else{
        argsOffset = `v${argsOffsetValue}.i256`
      }

      let callResultValue = nextValue()
      let successBlock = nextBlock()
      let revertBlock = nextBlock()
      compiledSonatinaInstructions += `    v${callResultValue}.i256 = evm_call ${gas} ${contractAddress} ${callValue} ${argsOffset} ${argsSize}.i256 0.i256 0.i256;\n`;
      compiledSonatinaInstructions += `    br ${callResultValue}.i256 block${successBlock} block${revertBlock};\n`
      compiledSonatinaInstructions += `  block${revertBlock}:\n`
      compiledSonatinaInstructions += `    evm_revert 0.i256 0.i256;\n`// TODO: call a %revert instead of this
      compiledSonatinaInstructions += `  block${successBlock}:\n`
      blocks.set(successBlock, {labelValues: new Map(),  dominantBlock: currentBlock})
      currentBlock = successBlock 
    } else if(instructions[i].name == "revert")
    {
      compiledSonatinaInstructions += `    evm_revert 0.i256 0.i256;\n`;
    }
  }
  lastCurrentBlock = currentBlock
  return compiledSonatinaInstructions
}