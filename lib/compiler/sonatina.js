var blocks = new Map()
var labelTypes = new Map()
var memoryVariables = new Map()
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

function labelToSSAVariable(label, block) {
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

// Main function
function compileToSonatina(unicodeCodePoints) {
  prepareCompilation(unicodeCodePoints)
  parse()

  let sonatinaCode = ""
  for(let i=0; i<functions.length; i++)
  {
    blocks = new Map()
    labelTypes = new Map()
    sonatinaVariableCounter = 0
    sonatinaBlockCounter = 0
    memoryVariables = new Map()
    initMemory()

    blocks.set(0, {labelValues: new Map(),  dominantBlock: null})

    sonatinaCode += "func %" + functions[i].name
    sonatinaCode += "("
    for(let j=0; j<functions[i].parameters.length; j++) {
      let type = solidityTypeToSonatinaType(functions[i].parameters[j].type)
      sonatinaCode += "v"+sonatinaVariableCounter+"."+type
      if(j+1<functions[i].parameters.length) {
        sonatinaCode += ", "
      }
      blocks.get(0).labelValues.set(functions[i].parameters[j].label, { value: sonatinaVariableCounter, type: type})
      labelTypes.set(functions[i].parameters[j].label, type)
      sonatinaVariableCounter+=1
    }
    sonatinaCode += ")"
    if(functions[i].returnType)
      sonatinaCode += " -> " + solidityTypeToSonatinaType(functions[i].returnType) + " "
    sonatinaCode += "{\n"
    sonatinaCode += compileBlock(functions[i].instructions, sonatinaBlockCounter)
    sonatinaCode += "}\n\n"

    console.log(blocks)
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
        sonatinaRLValue = `v${sonatinaVariableCounter}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${sonatinaRLValue} evm_sload(${stateVariables.get(instructions[i].rlValue[0]).position})\n`
      } else {
        sonatinaRLValue = labelToSSAVariable(instructions[i].rlValue[0], currentBlock)
      }

      if(typeof instructions[i].rrValue == "bigint") {
        sonatinaRRValue = `${instructions[i].rrValue}.i256`
      }
      else if(stateVariables.has(instructions[i].rrValue[0])) {
        sonatinaRRValue = `v${sonatinaVariableCounter}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${sonatinaRRValue} = evm_sload(${stateVariables.get(instructions[i].rrValue[0]).position})\n`
      } else {
        sonatinaRRValue = labelToSSAVariable(instructions[i].rrValue[0], currentBlock)
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
        let temp = sonatinaVariableCounter
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    v${temp} = ${operator} ${sonatinaRLValue} ${sonatinaRRValue}\n`
        compiledSonatinaInstructions += `    evm_sstore(${stateVariables.get(instructions[i].lValue[0]).position} v${temp})\n`
      } else {
        let value = sonatinaVariableCounter
        let type = labelTypes.get(instructions[i].lValue[0])
        sonatinaVariableCounter += 1
        blocks.get(currentBlock).labelValues.set(instructions[i].lValue[0], {value: value, type: type})
        compiledSonatinaInstructions += `    v${value}.${type} = ${operator} ${sonatinaRLValue} ${sonatinaRRValue}\n`;
      }
    }else if(instructions[i].name == "returnLiteral")
    {
      let literal = instructions[i].value
      let type = solidityTypeToSonatinaType(instructions[i].returnType)
      compiledSonatinaInstructions += `    return ${literal}.${type}\n`;
    }else if(instructions[i].name == "returnLabel")
    {
      if(stateVariables.has(instructions[i].value[0])) {
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].value[0]).type)
        let temp = `v${sonatinaVariableCounter}.${type}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${temp} = evm_sload(${stateVariables.get(instructions[i].value[0]).position})\n`
        compiledSonatinaInstructions += `    return ${temp}\n`;
      } else if(memoryVariables.has(instructions[i].value[0])) {
        let type = solidityTypeToSonatinaType(memoryVariables.get(instructions[i].value[0]).type)
        let temp = `v${sonatinaVariableCounter}.${type}`
        compiledSonatinaInstructions += `    ${temp} = evm_mload(${memoryVariables.get(instructions[i].value[0]).location})\n`
        compiledSonatinaInstructions += `    return ${temp}\n`;
        sonatinaVariableCounter += 1
      } else {
        compiledSonatinaInstructions += `    return ${labelToSSAVariable(instructions[i].value[0],currentBlock)}\n`;
      }
    }else if(instructions[i].name == "assignment")
    {
      let sonatinaRValue = ""
      if(stateVariables.has(instructions[i].rValue[0])) {
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].rValue[0]).type)
        sonatinaRValue = `v${sonatinaVariableCounter}.${type}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${sonatinaRValue} = evm_sload(${stateVariables.get(instructions[i].rValue[0]).position})\n`
      } else if (memoryVariables.has(instructions[i].rValue[0])) {
        let type = solidityTypeToSonatinaType(memoryVariables.get(instructions[i].rValue[0]).type)
        let temp = sonatinaVariableCounter
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    v${temp}.${type} = evm_mload(${memoryVariables.get(instructions[i].rValue[0]).location})\n`
        sonatinaRValue += `v${temp}.${type}`
      } else {
        sonatinaRValue = labelToSSAVariable(instructions[i].rValue[0],currentBlock)
      }

      if(stateVariables.has(instructions[i].lValue[0])) {
        compiledSonatinaInstructions += `    evm_sstore(${stateVariables.get(instructions[i].lValue[0]).position} ${sonatinaRValue})\n`
      } else if (memoryVariables.has(instructions[i].lValue[0])) {
        let type = solidityTypeToSonatinaType(memoryVariables.get(instructions[i].lValue[0]).type)
        compiledSonatinaInstructions += `    evm_mstore(${memoryVariables.get(instructions[i].lValue[0]).location} ${sonatinaRValue})\n`
      } else {
        let value = sonatinaVariableCounter
        let type = labelTypes.get(instructions[i].lValue[0])
        sonatinaVariableCounter += 1
        blocks.get(currentBlock).labelValues.set(instructions[i].lValue[0], {value: value, type: type})
        compiledSonatinaInstructions += `    v${value}.${type} = ${sonatinaRValue}\n`;
      }
    }else if(instructions[i].name == "literalAssignment")
    {
      if(stateVariables.has(instructions[i].lValue[0])) {
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].lValue[0]).type)
        compiledSonatinaInstructions += `    evm_sstore(${stateVariables.get(instructions[i].lValue[0]).position} ${instructions[i].rValue}.${type})\n`
      } else if (memoryVariables.has(instructions[i].lValue[0])) {
        let type = solidityTypeToSonatinaType(memoryVariables.get(instructions[i].lValue[0]).type)
        compiledSonatinaInstructions += `    evm_mstore(${memoryVariables.get(instructions[i].lValue[0]).location} ${instructions[i].rValue}.${type})\n`
      } else {
        let value = sonatinaVariableCounter
        let type = labelTypes.get(instructions[i].lValue[0])
        sonatinaVariableCounter += 1
        blocks.get(currentBlock).labelValues.set(instructions[i].lValue[0], {value: value, type: labelTypes.get(instructions[i].lValue[0])})
        compiledSonatinaInstructions += `    v${value}.${type} = ${instructions[i].rValue}.${type}\n`;
      }
    }else if(instructions[i].name == "logEvent")
    {
      let eventSignature = getEmojiDescription(instructions[i].topics[0][0]) + getEmojiDescription(instructions[i].topics[0][1])
      eventSignature = functionNameConversor(convertToFunctionName(eventSignature))
      let topics = ""
      for(let j=1; j<instructions[i].topics.length; j++) {
        if(stateVariables.has(instructions[i].topics[j][0])) {
          let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].topics[j][0]).type)
          let temp = sonatinaVariableCounter
          sonatinaVariableCounter += 1
          compiledSonatinaInstructions += `    v${temp}.${type} = evm_sload(${stateVariables.get(instructions[i].topics[j][0]).position})\n`
          topics += ` v${temp}.${type}`
        } else {
          topics += ` ${labelToSSAVariable(instructions[i].topics[j][0],currentBlock)}`
        }
      }
      compiledSonatinaInstructions += `    LOG(${eventSignature} ${topics})\n`;
    }else if(instructions[i].name == "ifStatement")
    {
      let conditionVariable = labelToSSAVariable(instructions[i].condition[0], currentBlock)
      sonatinaBlockCounter += 1
      let ifTrueBlock = sonatinaBlockCounter
      sonatinaBlockCounter += 1
      let mergeBlock = sonatinaBlockCounter
      compiledSonatinaInstructions += `    br ${conditionVariable} block${ifTrueBlock} block${mergeBlock}\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, ifTrueBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${mergeBlock}:\n`
      compiledSonatinaInstructions += `  block${mergeBlock}:\n`

      blocks.set(mergeBlock, {labelValues: new Map(),  dominantBlock: currentBlock})

      let ifTrueReturningBlock = lastCurrentBlock

      // Naively add all variables to phi
      for (const [label, value] of labelTypes.entries()) {
        let phiIfTrue = labelToSSAVariable(label, ifTrueReturningBlock)
        let phiIfFalse = labelToSSAVariable(label, mergeBlock)
        let value = sonatinaVariableCounter
        let type = labelTypes.get(label)
        sonatinaVariableCounter += 1
        blocks.get(mergeBlock).labelValues.set(label, {value: value, type: labelTypes.get(label)})
        compiledSonatinaInstructions += `    v${value}.${type} = phi (${phiIfTrue} block${ifTrueReturningBlock}) (${phiIfFalse} block${currentBlock})\n`
      }
      currentBlock = mergeBlock
    }else if(instructions[i].name == "whileLoop")
    {
      sonatinaBlockCounter += 1
      let headerBlock = sonatinaBlockCounter
      sonatinaBlockCounter += 1
      let bodyBlock = sonatinaBlockCounter
      sonatinaBlockCounter += 1
      let exitBlock = sonatinaBlockCounter

      compiledSonatinaInstructions += `  block${headerBlock}:\n`

      let conditionValue = null
      if(stateVariables.has(instructions[i].condition[0])) {
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].condition[0]).type)
        conditionValue = `v${sonatinaVariableCounter}.${type}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${conditionValue} = evm_sload(${stateVariables.get(instructions[i].condition[0]).position})\n`
      } else if (memoryVariables.has(instructions[i].condition[0])) {
        let type = solidityTypeToSonatinaType(memoryVariables.get(instructions[i].condition[0]).type)
        conditionValue = `v${sonatinaVariableCounter}.${type}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${conditionValue} = evm_mload(${memoryVariables.get(instructions[i].condition[0]).location})\n`
      } else {
        conditionValue = labelToSSAVariable(instructions[i].condition[0], currentBlock)
      }

      compiledSonatinaInstructions += `    br ${conditionValue} block${bodyBlock} block${exitBlock}\n`
      compiledSonatinaInstructions += compileBlock(instructions[i].instructions, bodyBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${headerBlock}:\n`
      compiledSonatinaInstructions += `  block${exitBlock}:\n`

      blocks.set(exitBlock, {labelValues: new Map(),  dominantBlock: currentBlock})
    }else if(instructions[i].name == "declareUint"
        || instructions[i].name == "declareAddress" // TODO: Should we differentiate types?
        || instructions[i].name == "declareString"
        || instructions[i].name == "declareBool"
    )
    {
      let location = allocateMemory(32)
      memoryVariables.set(instructions[i].label[0], {location: location, type: instructions[i].type})
    }else if(instructions[i].name == "externalCall")
    {
      // TODO
    }else if(instructions[i].name == "revert")
    {
      compiledSonatinaInstructions += `    REVERT\n`;
    }
  }
  lastCurrentBlock = currentBlock
  return compiledSonatinaInstructions
}