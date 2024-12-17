var blocks = new Map()
var labelTypes = new Map()
var sonatinaVariableCounter = 0
var sonatinaBlockCounter = 0
var lastCurrentBlock = null //TODO REMOVE THIS

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
    default:
      type = solidityType
  }
  return type
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
  return `v${value}.${type}`
}

function processPhiAssignments(destinationBlock, originBlockA, originBlockB) {
  let returnValue = ""
  for (const [label, value] of labelTypes.entries()) {
    let phiValueA = labelToValue(label, originBlockA)
    let phiValueB = labelToValue(label, originBlockB)
    let value = nextValue()
    let type = labelTypes.get(label)
    blocks.get(destinationBlock).labelValues.set(label, {value: value, type: labelTypes.get(label)})
    returnValue += `    v${value}.${type} = phi (${phiValueA} block${originBlockA}) (${phiValueB} block${originBlockB});\n`
  }
  return returnValue
}

// Main function
function compileToSonatina(unicodeCodePoints) {
  prepareCompilation(unicodeCodePoints)
  parse()

  let sonatinaCode = ""

  sonatinaCode += `func %main() {\n`
  sonatinaCode += `  block0:\n`
  sonatinaCode += `    v${nextValue()}.i256 = evm_call_data_load 0.i8;\n`
  sonatinaCode += `    v${nextValue()}.i256 = shr v0 224.i8;\n`
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
    sonatinaCode += "    call %" + functions[i].name
    for(let j=0; j<functions[i].parameters.length; j++) {
      sonatinaCode += ` v${values[j]}`
    }
    sonatinaCode += `;\n`
  }
  sonatinaCode += `  block1:\n`
  sonatinaCode += `    evm_revert;\n`
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

  return sonatinaCode
}

function compileBlock(instructions, currentBlock, /* optional */ parrentBlock) {
  if(parrentBlock != null)
    blocks.set(currentBlock, {labelValues: new Map(),  dominantBlock: parrentBlock})
  let compiledSonatinaInstructions = "  block" + currentBlock + ":\n"

  for(let i=0; i<instructions.length; i++) {
    if(instructions[i].name == "operation")
    {
      let sonatinaRLValue = null
      let sonatinaRRValue = null

      if(typeof instructions[i].rlValue == "bigint") {
        sonatinaRLValue = `${instructions[i].rlValue}.i256`
      }
      else if(stateVariables.has(instructions[i].rlValue[0])) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].rlValue[0]).type)
        sonatinaRLValue = `v${value}.${type}`
        compiledSonatinaInstructions += `    ${sonatinaRLValue} evm_sload ${stateVariables.get(instructions[i].rlValue[0]).position};\n`
      } else {
        sonatinaRLValue = labelToValue(instructions[i].rlValue[0], currentBlock)
      }

      if(typeof instructions[i].rrValue == "bigint") {
        sonatinaRRValue = `${instructions[i].rrValue}.i256`
      }
      else if(stateVariables.has(instructions[i].rrValue[0])) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].rrValue[0]).type)
        sonatinaRRValue = `v${value}.${type}`
        compiledSonatinaInstructions += `    ${sonatinaRRValue} = evm_sload ${stateVariables.get(instructions[i].rrValue[0]).position};\n`
      } else {
        sonatinaRRValue = labelToValue(instructions[i].rrValue[0], currentBlock)
      }

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

      if(stateVariables.has(instructions[i].lValue[0])) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].lValue[0]).type)
        compiledSonatinaInstructions += `    v${value}.${type} = ${operator} ${sonatinaRLValue} ${sonatinaRRValue};\n`
        compiledSonatinaInstructions += `    evm_sstore(${stateVariables.get(instructions[i].lValue[0]).position} v${value}.${type});\n`
      } else {
        let value = nextValue()
        let type = labelTypes.get(instructions[i].lValue[0])
        blocks.get(currentBlock).labelValues.set(instructions[i].lValue[0], {value: value, type: type})
        compiledSonatinaInstructions += `    v${value}.${type} = ${operator} ${sonatinaRLValue} ${sonatinaRRValue};\n`;
      }
    }else if(instructions[i].name == "returnLiteral")
    {
      let literal = instructions[i].value
      let type = solidityTypeToSonatinaType(instructions[i].returnType)
      compiledSonatinaInstructions += `    return ${literal}.${type};\n`;
    }else if(instructions[i].name == "returnLabel")
    {
      if(stateVariables.has(instructions[i].value[0])) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].value[0]).type)
        let temp = `v${value}.${type}`
        compiledSonatinaInstructions += `    ${temp} = evm_sload ${stateVariables.get(instructions[i].value[0]).position};\n`
        compiledSonatinaInstructions += `    return ${temp};\n`;
      } else {
        compiledSonatinaInstructions += `    return ${labelToValue(instructions[i].value[0],currentBlock)};\n`;
      }
    }else if(instructions[i].name == "assignment")
    {
      let sonatinaRValue = ""
      if(stateVariables.has(instructions[i].rValue[0])) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].rValue[0]).type)
        sonatinaRValue = `v${value}.${type}`
        compiledSonatinaInstructions += `    ${sonatinaRValue} = evm_sload ${stateVariables.get(instructions[i].rValue[0]).position};\n`
      } else {
        sonatinaRValue = labelToValue(instructions[i].rValue[0],currentBlock)
      }

      if(stateVariables.has(instructions[i].lValue[0])) {
        compiledSonatinaInstructions += `    evm_sstore ${stateVariables.get(instructions[i].lValue[0]).position} ${sonatinaRValue};\n`
      } else {
        let value = nextValue()
        let type = labelTypes.get(instructions[i].lValue[0])
        blocks.get(currentBlock).labelValues.set(instructions[i].lValue[0], {value: value, type: type})
        compiledSonatinaInstructions += `    v${value}.${type} = ${sonatinaRValue};\n`;
      }
    }else if(instructions[i].name == "literalAssignment")
    {
      if(stateVariables.has(instructions[i].lValue[0])) {
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].lValue[0]).type)
        compiledSonatinaInstructions += `    evm_sstore ${stateVariables.get(instructions[i].lValue[0]).position} ${instructions[i].rValue}.${type};\n`
      } else {
        let value = nextValue()
        let type = labelTypes.get(instructions[i].lValue[0])
        blocks.get(currentBlock).labelValues.set(instructions[i].lValue[0], {value: value, type: labelTypes.get(instructions[i].lValue[0])})
      }
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
        if(stateVariables.has(instructions[i].topics[j][0])) {
          let value = nextValue()
          let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].topics[j][0]).type)
          compiledSonatinaInstructions += `    v${value}.${type} = evm_sload ${stateVariables.get(instructions[i].topics[j][0]).position};\n`
          topics += ` v${value}.${type}`
        } else {
          topics += ` ${labelToValue(instructions[i].topics[j][0],currentBlock)}`
        }
      }
      compiledSonatinaInstructions += `    evm_log${instructions[i].topics.length} v${memoryOffsetValue}.i256 32.i256${topics};\n`;
    }else if(instructions[i].name == "ifStatement")
    {
      let conditionVariable = labelToValue(instructions[i].condition[0], currentBlock)
      let ifTrueBlock = nextBlock()
      let mergeBlock = nextBlock()
      compiledSonatinaInstructions += `    br ${conditionVariable} block${ifTrueBlock} block${mergeBlock};\n`
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
        compiledSonatinaInstructions += `    v${value}.${type} = phi (${phiIfTrue} block${ifTrueReturningBlock}) (${phiIfFalse} block${currentBlock});\n`
      }
      currentBlock = mergeBlock
    }else if(instructions[i].name == "whileLoop")
    {
      let conditionVariable = labelToValue(instructions[i].condition[0], currentBlock)
      let bodyBlock = nextBlock()
      let conditionBlock = nextBlock()
      let exitBlock = nextBlock()

      compiledSonatinaInstructions += `    jump block${conditionBlock};\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, bodyBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${conditionBlock};\n`
      compiledSonatinaInstructions += `  block${conditionBlock}:\n`
      blocks.set(conditionBlock, {labelValues: new Map(),  dominantBlock: currentBlock})
      compiledSonatinaInstructions += processPhiAssignments(conditionBlock, bodyBlock, currentBlock)
      conditionVariable = labelToValue(instructions[i].condition[0], conditionBlock)
      compiledSonatinaInstructions += `    br ${conditionVariable} block${bodyBlock} block${exitBlock};\n`
      compiledSonatinaInstructions += `  block${exitBlock}:\n`
      currentBlock = conditionBlock
      /*
      compiledSonatinaInstructions += `    jump block${mergeBlock}:\n`

      // Naively add all variables to phi
      for (const [label, value] of labelTypes.entries()) {
        let phiIfTrue = labelToValue(label, ifTrueReturningBlock)
        let phiIfFalse = labelToValue(label, mergeBlock)
        let value = nextValue()
        let type = labelTypes.get(label)
        blocks.get(mergeBlock).labelValues.set(label, {value: value, type: labelTypes.get(label)})
        compiledSonatinaInstructions += `    v${value}.${type} = phi (${phiIfTrue} block${ifTrueReturningBlock}) (${phiIfFalse} block${currentBlock})\n`
      }

      let conditionValue = null
      if(stateVariables.has(instructions[i].condition[0])) {
        let value = nextValue()
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].condition[0]).type)
        conditionValue = `v${value}.${type}`
        compiledSonatinaInstructions += `    ${conditionValue} = evm_sload(${stateVariables.get(instructions[i].condition[0]).position})\n`
      } else {
        conditionValue = labelToValue(instructions[i].condition[0], currentBlock)
      }

      compiledSonatinaInstructions += `    br ${conditionValue} block${bodyBlock} block${exitBlock}\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, bodyBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${conditionBlock}:\n`
      compiledSonatinaInstructions += `  block${exitBlock}:\n`

      blocks.set(exitBlock, {labelValues: new Map(),  dominantBlock: currentBlock})
      */
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
      // TODO
    }else if(instructions[i].name == "revert")
    {
      compiledSonatinaInstructions += `    evm_revert;\n`;
    }
  }
  lastCurrentBlock = currentBlock
  return compiledSonatinaInstructions
}