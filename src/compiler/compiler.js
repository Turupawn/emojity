if (typeof window == 'undefined') {
  const { initMemory } = require('../evm/memory.js');
  const { parseNumber, parseConstructor, parseStateVariable, parseFunction } = require('./parser.js');
  const { toEmoji, getEmojiDescription, loadEmojiLib } = require('../emoji/emoji.js');
  const {
    getCurrentToken,
    advanceToken,
    resetCurrentToken,
    getCurrentJumpDestination,
    addvanceCurrentJumpDestination,
    resetCurrentJumpDestination,
    setTokens,
    getTokensLength,
    getToken,
    resetFunctions,
    getFunctionsLength,
    getFunction,
    resetStateVariables,
    resetLocalVariables,
    resetConstructorInstructions,
    getRevertDestination,
    setRevertDestination,
  } = require('../globals/globals.js')

  const { addPushJump, addOpcode, addJumpDestination, addPush, irCodeToBytecode } = require('./irCode.js');
  const { getFunctionSignature } = require('./utils.js');
  const { selectorLookupIr, functionLogic, intToHex, contractHeader } = require('../evm/evm.js');

  const { compileToSonatina } = require('./sonatina.js');

  const { keccak256 } = require('../lib/js-sha3@0.8.0_build_sha3.min.js');
}

const MAYOR_VERSION = 1
const MINOR_VERSION = 0

resetStateVariables()
resetLocalVariables()
resetConstructorInstructions()

function nextToken()
{
    do {
        advanceToken()
    }while(getCurrentToken()<getTokensLength()
        && toEmoji(getToken(getCurrentToken())) == '🛑')
}

function nextJumpDestination()
{
  addvanceCurrentJumpDestination()
}

function prepareCompilation(unicodeCodePoints) {
  resetCurrentToken()
  resetCurrentJumpDestination()
  initMemory()
  setTokens(unicodeCodePoints)
  resetFunctions()
  resetStateVariables()

  let mayorVersion = parseInt(parseNumber())
  let parser = getToken(getCurrentToken())
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
  let functionSignaturesDestination = getCurrentJumpDestination()
  nextJumpDestination()
  let loadFunctionSignaturesDestination = getCurrentJumpDestination()
  nextJumpDestination()
  setRevertDestination(getCurrentJumpDestination())
  nextJumpDestination()

  addPushJump(functionSignaturesDestination)
  addPushJump(loadFunctionSignaturesDestination)
  addOpcode("JUMP")
  addJumpDestination(functionSignaturesDestination)
  for(let i=0; i<getFunctionsLength(); i++)
  {
      let jumpDestination = getCurrentJumpDestination()
      nextJumpDestination()
      getFunction(i).jumpDestination = jumpDestination

      functionSignature = getFunctionSignature(getFunction(i).name, getFunction(i).parameters)
      selectorLookupIr(functionSignature, jumpDestination)
  }
  addPush("00")
  addOpcode("DUP1")
  addOpcode("REVERT")
  for(let i=0; i<getFunctionsLength(); i++)
  {
      functionLogic(getFunction(i).jumpDestination, getFunction(i))
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
  addJumpDestination(getRevertDestination())
  addPush("00")
  addPush("00")
  addOpcode("REVERT")

  contractBody = irCodeToBytecode()
  //contractBody = begin + push(functionSelector) + end
  contractBodySize = intToHex(contractBody.length/2)

  return contractHeader(contractBodySize) + contractBody
}

function generateJsonMetadata(abi, compilerVersion, backend, license, fileKeccak256, urls) {
  return `{\n`
      + `  "compiler": { "version": "${compilerVersion}" },\n`
      + `  "language": "Emojity",\n`
      + `  "output": {\n`
      + `    "abi": "${abi}",\n`
      + `  "settings": {\n`
      + `    "backend": "${backend}"\n`
      + `  },\n`
      + `  "sources": {\n`
      + `    "main.emojity": {\n`
      + `      "keccak256": "${fileKeccak256}",\n`
      + `      "license": "${license}",\n`
      + `      "urls": ${JSON.stringify(urls)}\n`
      + `    }\n`
      + `  },\n`
      + `  "version": 1\n`
      + `}`
}

function generateSolidityInterface() {
  let solidityInterface = '// SPDX-License-Identifier: MIT\n'
  solidityInterface += 'pragma solidity ^0.8.20;\n\n'
  solidityInterface += 'interface EmojiContract {\n'
  for(let i=0; i<getFunctionsLength(); i++)
  {
    let fn = getFunction(i)
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
  for(let i=0; i<getFunctionsLength(); i++)
  {
    let fn = getFunction(i)
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

const compile = async (code) => {
  var unicodeCodePoints = [];
  var codeOneLiner = code.replace(/\n/g, "🛑")
  if (codeOneLiner) {
    twemoji.parse(codeOneLiner, function(icon, options, variant) {
      unicodeCodePoints.push(icon);
    });
  }

  const contractBytecode = compileToEVMBytecode(unicodeCodePoints)
  const sonatina = compileToSonatina(unicodeCodePoints)
  const abi = generateABI()
  const jsonMetadata = generateJsonMetadata(abi, MAYOR_VERSION+"."+MINOR_VERSION, "emojity", "TODO", "0x"+keccak256(code), ["TODO"])
  const solidityInterface = generateSolidityInterface()
  return {
    bytecode: contractBytecode,
    abi: abi,
    metadata: jsonMetadata,
    solidityInterface: solidityInterface,
    sonatina: sonatina
  }
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

if (typeof window == 'undefined') {
  module.exports = { compile, nextToken, prepareCompilation, parse };
}
