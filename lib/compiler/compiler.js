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