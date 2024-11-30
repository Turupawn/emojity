const MAYOR_VERSION = 0
const MINOR_VERSION = 0

var currentToken
var currentJumpDestination
var tokens
var functions
var stateVariables = new Map()
var localVariables = new Map()
var constructorInstructions = []
var revertDestination

// Sonatina data
var ssaVariables = new Map()
var sonatinaVariableCounter = 0
var sonatinaBlockCounter = 0

function nextToken()
{
    do {
        currentToken+=1
    }while(currentToken<tokens.length
        && toEmoji(tokens[currentToken]) == '🛑')
}

function nextJumpDestination()
{
  currentJumpDestination += 1
}

function prepareCompilation(unicodeCodePoints) {
  currentToken = 0
  currentJumpDestination = 0
  initMemory()
  tokens = unicodeCodePoints
  functions = []
  stateVariables = new Map()

  let mayorVersion = parseInt(parseNumber())
  let parser = tokens[currentToken]
  nextToken()
  let minorVersion = parseInt(parseNumber())

  if(mayorVersion != MAYOR_VERSION
      || minorVersion != MINOR_VERSION)
  {
    console.log("Error: invalid compiler version, "
      + MAYOR_VERSION + toEmoji(parser) + MINOR_VERSION + " expected "
      + mayorVersion + toEmoji(parser) + minorVersion + " found ")
  }
}

function parse() {
  let stateValuefound
  do
  {
      stateValuefound = parseStateVariable()
  }while(stateValuefound)

  parseConstructor()

  parseFunction()
}

function compileToEVMBytecode(unicodeCodePoints) {
  prepareCompilation(unicodeCodePoints)
  parse()
  
  irCode = []
  let functionSignaturesDestination = currentJumpDestination
  nextJumpDestination()
  let loadFunctionSignaturesDestination = currentJumpDestination
  nextJumpDestination()
  revertDestination = currentJumpDestination
  nextJumpDestination()

  addPushJump(functionSignaturesDestination)
  addPushJump(loadFunctionSignaturesDestination)
  addOpcode("JUMP")
  addJumpDestination(functionSignaturesDestination)
  for(let i=0; i<functions.length; i++)
  {
      let jumpDestination = currentJumpDestination
      nextJumpDestination()
      functions[i].jumpDestination = jumpDestination

      functionSignature = getFunctionSignature(functions[i].name, functions[i].parameters)
      selectorLookupIr(functionSignature, jumpDestination)
  }
  addPush("00")
  addOpcode("DUP1")
  addOpcode("REVERT")
  for(let i=0; i<functions.length; i++)
  {
      functionLogic(functions[i].jumpDestination, functions[i])
  }
  addJumpDestination(loadFunctionSignaturesDestination)
  addPush("00")
  addPush("0100000000000000000000000000000000000000000000000000000000")
  addPush("00")
  addOpcode("CALLDATALOAD")
  addOpcode("DIV")
  addOpcode("SWAP1")
  addOpcode("POP")
  addOpcode("SWAP1")
  addOpcode("JUMP")
  addJumpDestination(revertDestination)
  addPush("00")
  addPush("00")
  addOpcode("REVERT")

  contractBody = irCodeToBytecode()
  //contractBody = begin + push(functionSelector) + end
  contractBodySize = intToHex(contractBody.length/2)

  return contractHeader(contractBodySize) + contractBody
}

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
      let type = ""
      switch(functions[i].parameters[j].type) {
        case "uint256":
          type = "u256"
          break;
        case "uint32":
          type = "u32"
          break;
        default:
          type = functions[i].parameters[j].type
      }
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

// SSA Sonatina Helpers
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
      if(typeof instructions[i].rlValue == "bigint")
        sonatinaRLValue = `${instructions[i].rlValue}.u256`
      else
        sonatinaRLValue = labelToSSAVariable(instructions[i].rlValue[0], currentBlock)

      if(typeof instructions[i].rrValue == "bigint")
        sonatinaRRValue = `${instructions[i].rrValue}.u256`
      else
        sonatinaRRValue = labelToSSAVariable(instructions[i].rrValue[0], currentBlock)
      addValueToSSA(instructions[i].lValue[0], currentBlock)
      let sonatinaLValue = labelToSSAVariable(instructions[i].lValue[0], currentBlock)
      compiledSonatinaInstructions += `    ${sonatinaLValue} = `

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
      compiledSonatinaInstructions += `${operator} ${sonatinaRLValue} ${sonatinaRRValue}\n`;
    }else if(instructions[i].name == "returnLiteral")
    {
      // TODO
    }else if(instructions[i].name == "returnLabel")
    {
      // TODO, also return state and memory variables
      compiledSonatinaInstructions += `    return ${labelToSSAVariable(instructions[i].value[0],currentBlock)}\n`;
    }else if(instructions[i].name == "assignment")
    {
      // TODO
    }else if(instructions[i].name == "literalAssignment")
    {
      // TODO
    }else if(instructions[i].name == "logEvent")
    {
      // TODO
    }else if(instructions[i].name == "ifStatement")
    {
      //console.log(instructions[i])
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
      // TODO
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
      // TODO
    }
  }
  return compiledSonatinaInstructions
}

function generateSolidityInterface() {
  let solidityInterface = '// SPDX-License-Identifier: MIT\n'
  solidityInterface += 'pragma solidity ^0.8.20;\n\n'
  solidityInterface += 'interface EmojiContract {\n'
  for(let i=0; i<functions.length; i++)
  {
    let fn = functions[i]
    solidityInterface += '\tfunction '
    solidityInterface += fn.name + '('
    for(let j=0; j<fn.parameters.length; j++)
    {
      let parameter = fn.parameters[j]
      let parameterName = getEmojiDescription(parameter.label)
      parameterName = parameterName.charAt(0).toLowerCase() + parameterName.slice(1);
      let parameterType = parameter.type

      if(j!=0)
          solidityInterface += ","
      solidityInterface += parameterType
      if(parameterType == "string")
          solidityInterface += " memory"
      solidityInterface += " "
      solidityInterface +=parameterName
    }
    solidityInterface += ') external '
    if(fn.visibility == "view")
    {
      solidityInterface += 'view '
    }

    if(fn.returnType)
    {
      solidityInterface += 'returns (' + fn.returnType
      if(fn.returnType == "string")
          solidityInterface += " memory"
      solidityInterface += ')'
    }
    solidityInterface += ';\n'
  }
  solidityInterface += '}'

  return solidityInterface
}

function generateABI() {
  var abi = '['
  for(let i=0; i<functions.length; i++)
  {
    let fn = functions[i]
    if(i!=0)
    {
      abi += ','
    }
    abi += '{"inputs": ['
    for(let j=0; j<fn.parameters.length; j++)
    {
      if(j!=0)
      {
        abi += ','
      }
      let parameter = fn.parameters[j]
      let parameterName = getEmojiDescription(parameter.label)
      parameterName = parameterName.charAt(0).toLowerCase() + parameterName.slice(1);
      let parameterType = parameter.type
      abi += '{"name":"'
      abi += parameterName
      abi += '","type":"'
      abi += parameterType
      abi += '"}'
    }
    abi += '],"name": "'
    abi += fn.name
    abi += '","outputs": ['
    if(fn.returnType)
    {
        abi += '{"internalType": "'
        abi += fn.returnType
        abi += '", "name": "", "type": "'
        abi += fn.returnType
        abi += '"}'
    }
    abi += '], "stateMutability": "'
    abi += fn.visibility
    abi += '", "type": "function"}'
  }
  abi += "]"
  return abi
}

const compile = async (unicodeCodePoints) => {
  console.log("Compiling to EVM")
  const contractBytecode = compileToEVMBytecode(unicodeCodePoints)
  console.log("Compiling to Sonatina")
  const sonatina = compileToSonatina(unicodeCodePoints)
  const solidityInterface = generateSolidityInterface()
  const abi = generateABI()
  console.log(sonatina)

  document.getElementById("_bytecode").value = contractBytecode
  document.getElementById("_abi").value = abi
  document.getElementById("_solidityInterface").value = solidityInterface
  document.getElementById("_sonatina").value = sonatina
}

const deploy = async (abi, bytecode) => {
  const MyContract = new web3.eth.Contract(JSON.parse(abi));
  // Deploy the smart contract
  const deployedContract = await MyContract.deploy({
      data: bytecode,
      arguments: [/* constructor arguments if any */]
  }).send({
      from: accounts[0],
  });

  document.getElementById("_contractAddress").value = deployedContract.options.address
}