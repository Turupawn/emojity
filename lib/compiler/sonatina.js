// Utility
function solidityTypeToSonatinaType(solidityType) {
  let type = ""
  switch(solidityType) {
    case "uint256":
      type = "u256"
      break;
    case "uint32":
      type = "u32"
      break;
    default:
      type = solidityType
  }
  return type
}

function addValueToSSA(label, block) {
  ssaVariables.get(label).values.push({block: block, v: sonatinaVariableCounter})
  sonatinaVariableCounter += 1
}

function labelToSSAVariable(label, block /* Optional */) {
  ssaVariableArray = ssaVariables.get(label).values
  let type = ssaVariables.get(label).type
  if(block == null)
  {
    return "v" + ssaVariableArray[ssaVariableArray.length-1].v + "." + type
  }

  for(let i=ssaVariableArray.length-1; i>=0; i--)
  {
    if(block == ssaVariableArray[i].block) {
      return "v" + ssaVariableArray[i].v + "." + type
    }
  }
  console.log("Error: Could not find SSA value for " + label)
  return null
}

// Main function
function compileToSonatina(unicodeCodePoints) {
  prepareCompilation(unicodeCodePoints)
  parse()

  let sonatinaCode = ""
  for(let i=0; i<functions.length; i++)
  {
    ssaVariables = new Map()
    sonatinaVariableCounter = 0
    sonatinaBlockCounter = 0
    sonatinaCode += "funct %" + functions[i].name

    sonatinaCode += "("
    for(let j=0; j<functions[i].parameters.length; j++) {
      let type = solidityTypeToSonatinaType(functions[i].parameters[j].type)
      sonatinaCode += "v"+sonatinaVariableCounter+"."+type
      if(j+1<functions[i].parameters.length) {
        sonatinaCode += ", "
      }
      ssaVariables.set(functions[i].parameters[j].label, {type: type, values: [{block: 0, v: sonatinaVariableCounter}]})
      sonatinaVariableCounter+=1
    }
    sonatinaCode += ")"
    if(functions[i].returnType)
      sonatinaCode += " -> " + functions[i].returnType + " "
    sonatinaCode += "{\n"
    sonatinaCode += compileSonatinaInstructions(functions[i].instructions, sonatinaBlockCounter)
    sonatinaCode += "}\n\n"
  }
  for(let i=0; i<functions.length; i++)
  {
      functionLogic(functions[i].jumpDestination, functions[i])
  }

  return sonatinaCode
}

function naivelyReloadAllVariables(currentBlock, parrentBlock) {
  let returnValue = ""
  for (const [label, value] of ssaVariables.entries()) {
    rValue = labelToSSAVariable(label, parrentBlock)
    addValueToSSA(label, currentBlock)
    lValue = labelToSSAVariable(label, currentBlock)
    returnValue += "    " + lValue + " = " + rValue + "\n"
  }
  return returnValue
}

function compileSonatinaInstructions(instructions, currentBlock, /* optional */ parrentBlock) {
  let compiledSonatinaInstructions = "  block" + currentBlock + ":\n"
  // Naively reload all variables
  if(parrentBlock != null)
  {
    compiledSonatinaInstructions += naivelyReloadAllVariables(currentBlock, parrentBlock)
  }
  for(let i=0; i<instructions.length; i++) {
    if(instructions[i].name == "operation")
    {
      let sonatinaRLValue = null
      let sonatinaRRValue = null

      if(typeof instructions[i].rlValue == "bigint") {
        sonatinaRLValue = `${instructions[i].rlValue}.u256`
      }
      else if(stateVariables.has(instructions[i].rlValue[0])) {
        sonatinaRLValue = `v${sonatinaVariableCounter}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${sonatinaRLValue} SLOAD(${stateVariables.get(instructions[i].rlValue[0]).position})\n`
      } else {
        sonatinaRLValue = labelToSSAVariable(instructions[i].rlValue[0], currentBlock)
      }

      if(typeof instructions[i].rrValue == "bigint") {
        sonatinaRRValue = `${instructions[i].rrValue}.u256`
      }
      else if(stateVariables.has(instructions[i].rrValue[0])) {
        sonatinaRRValue = `v${sonatinaVariableCounter}`
        sonatinaVariableCounter += 1
        compiledSonatinaInstructions += `    ${sonatinaRRValue} = SLOAD(${stateVariables.get(instructions[i].rrValue[0]).position})\n`
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
        compiledSonatinaInstructions += `    SSTORE(${stateVariables.get(instructions[i].lValue[0]).position} v${temp})\n`
      } else {
        addValueToSSA(instructions[i].lValue[0], currentBlock)
        let sonatinaLValue = labelToSSAVariable(instructions[i].lValue[0], currentBlock)
        compiledSonatinaInstructions += `    ${sonatinaLValue} = ${operator} ${sonatinaRLValue} ${sonatinaRRValue}\n`;
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
        compiledSonatinaInstructions += `    ${temp} = SLOAD(${stateVariables.get(instructions[i].value[0]).position})\n`
        compiledSonatinaInstructions += `    return ${temp}\n`;
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
        compiledSonatinaInstructions += `    ${sonatinaRValue} = SLOAD(${stateVariables.get(instructions[i].rValue[0]).position})\n`
      } else {
        sonatinaRValue = labelToSSAVariable(instructions[i].rValue[0],currentBlock)
      }

      if(stateVariables.has(instructions[i].lValue[0])) {
        compiledSonatinaInstructions += `    SSTORE(${stateVariables.get(instructions[i].lValue[0]).position} ${sonatinaRValue})\n`
      } else {
        addValueToSSA(instructions[i].lValue[0], currentBlock)
        let sonatinaLValue = labelToSSAVariable(instructions[i].lValue[0], currentBlock)
        compiledSonatinaInstructions += `    ${sonatinaLValue} = ${sonatinaRValue}\n`;
      }
    }else if(instructions[i].name == "literalAssignment")
    {
      if(stateVariables.has(instructions[i].lValue[0])) {
        let type = solidityTypeToSonatinaType(stateVariables.get(instructions[i].lValue[0]).type)
        compiledSonatinaInstructions += `    SSTORE(${stateVariables.get(instructions[i].lValue[0]).position} ${instructions[i].rValue}.${type})\n`
      } else {
        addValueToSSA(instructions[i].lValue[0], currentBlock)
        let type = ssaVariables.get(instructions[i].lValue[0]).type
        let sonatinaLValue = labelToSSAVariable(instructions[i].lValue[0], currentBlock)
        compiledSonatinaInstructions += `    ${sonatinaLValue} = ${instructions[i].rValue}.${type}\n`;
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
          compiledSonatinaInstructions += `    v${temp}.${type} = SLOAD(${stateVariables.get(instructions[i].topics[j][0]).position})\n`
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
      let ifFalseBlock = sonatinaBlockCounter
      sonatinaBlockCounter += 1
      let mergePoint = sonatinaBlockCounter
      compiledSonatinaInstructions += `    br ${conditionVariable} block${ifTrueBlock} block${ifFalseBlock}\n`
      compiledSonatinaInstructions += compileSonatinaInstructions(instructions[i].instructions, ifTrueBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${mergePoint}:\n`
      compiledSonatinaInstructions += `  block${ifFalseBlock}:\n`
      compiledSonatinaInstructions += naivelyReloadAllVariables(ifFalseBlock, currentBlock)
      compiledSonatinaInstructions += `    jump block${mergePoint}:\n`
      compiledSonatinaInstructions += `  block${mergePoint}:\n`
      currentBlock = mergePoint
      // Naively apply phi to all variables
      for (const [label, value] of ssaVariables.entries()) {
        phiIfTrue = labelToSSAVariable(label, ifTrueBlock)
        phiIfFalse = labelToSSAVariable(label, ifFalseBlock)
        addValueToSSA(label, currentBlock)
        lValue = labelToSSAVariable(label, currentBlock)
        compiledSonatinaInstructions += `    ${lValue} = phi (${phiIfTrue} block${ifTrueBlock}) (${phiIfFalse} block${ifFalseBlock})\n`
      }
    }else if(instructions[i].name == "whileLoop")
    {
      // TODO
    }else if(instructions[i].name == "declareUint"
        || instructions[i].name == "declareAddress" // TODO: Should we differentiate types?
        || instructions[i].name == "declareString"
        || instructions[i].name == "declareBool"
    )
    {
      // TODO
    }else if(instructions[i].name == "externalCall")
    {
      // TODO
    }else if(instructions[i].name == "revert")
    {
      compiledSonatinaInstructions += `    revert\n`;
    }
  }
  return compiledSonatinaInstructions
}