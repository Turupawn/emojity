var currentToken
var tokens
var functions
var stateVariables = new Map()
var constructorInstructions = []

function nextToken()
{
    do {
        currentToken+=1
    }while(currentToken<tokens.length
        && toEmoji(tokens[currentToken]) == '🛑')
}

const compile = async (unicodeCodePoints) => {
    currentToken = 0
    tokens = unicodeCodePoints
    functions = []
    stateVariables = new Map()

    let stateValuefound
    do
    {
        stateValuefound = parseStateVariable()
    }while(stateValuefound)

    parseConstructor()

    parseFunction()

    irCode = []

    addPushJump("1")
    addPushJump("0")
    addOpcode("JUMP")
    addJumpDestination("1")
    for(let i=0; i<functions.length; i++)
    {
        functionSignature = getFunctionSignature(functions[i].name, functions[i].parameters)
        selectorLookupIr(functionSignature, String.fromCharCode(109+i))
    }
    addPush("00")
    addOpcode("DUP1")
    addOpcode("REVERT")
    for(let i=0; i<functions.length; i++)
    {
        if(functions[i].returnType == "string")
        {
            functionLogicIR(String.fromCharCode(109+i), functions[i])
        }else
        {
            functionIntLogicIR(String.fromCharCode(109+i), functions[i])
        }
    }
    addJumpDestination("0")
    addPush("00")
    addPush("0100000000000000000000000000000000000000000000000000000000")
    addPush("00")
    addOpcode("CALLDATALOAD")
    addOpcode("DIV")
    addOpcode("SWAP1")
    addOpcode("POP")
    addOpcode("SWAP1")
    addOpcode("JUMP")
    addJumpDestination("R")
    addOpcode("REVERT")

    contractBody = irCodeToBytecode()
    //contractBody = begin + push(functionSelector) + end
    contractBodySize = intToHex(contractBody.length/2)
  
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

    document.getElementById("_bytecode").value = contractHeader(contractBodySize) + contractBody
    document.getElementById("_abi").value = abi
    document.getElementById("_solidityInterface").value = solidityInterface
}