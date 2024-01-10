var currentToken
var tokens
var functions

function nextToken()
{
    do {
        currentToken+=1
    }while(currentToken<tokens.length
        && toEmoji(tokens[currentToken]) == '🛑')
}

function functionNameConversor(functionName)
{
    if(functionName == "coinMoneyBag")
        return "totalSupply"
    if(functionName == "coinMoneyMouthFace")
        return "balanceOf"
    if(functionName == "coinMoneyWithWings")
        return "transfer"
    if(functionName == "coinPassportControl")
        return "allowance"
    if(functionName == "coinWhiteHeavyCheckMark")
        return "approve"
    if(functionName == "coinAtmSign")
        return "transferFrom"
    if(functionName == "coinNameBadge")
        return "name"
    if(functionName == "coinIDButton")
        return "symbol"
    if(functionName == "coinPie")
        return "decimals"

    return functionName
}

function parseNumber()
{
    if(currentToken >= tokens.length)
        return "";
    
    returnValue = ""
    do {
        switch (toEmoji(tokens[currentToken])) {
            case '0️⃣':
            returnValue += "0"
            break;
            case '1️⃣':
            returnValue += "1"
            break;
            case '2️⃣':
            returnValue += "2"
            break;
            case '3️⃣':
            returnValue += "3"
            break;
            case '4️⃣':
            returnValue += "4"
            break;
            case '5️⃣':
            returnValue += "5"
            break;
            case '6️⃣':
            returnValue += "6"
            break;
            case '7️⃣':
            returnValue += "7"
            break;
            case '8️⃣':
            returnValue += "8"
            break;
            case '9️⃣':
            returnValue += "9"
            break;
            case '🔟':
            returnValue += "10"
            break;
            default:
            return returnValue
        }
        nextToken()
    } while(currentToken <= tokens.length)
    return returnValue
}

function parseUint()
{
    numberBytes = parseNumber()
    currentToken-=1
    if(numberBytes == "8")
    {
        return "uint8"
    }else if(numberBytes == "16")
    {
        return "uint16"
    }else if(numberBytes == "32")
    {
        return "uint32"
    }else if(numberBytes == "64")
    {
        return "uint64"
    }else if(numberBytes == "128")
    {
        return "uint128"
    }else if(numberBytes == "256")
    {
        return "uint256"
    }
    return "uint256"
}

function parseParameter()
{
    let parameter = ""

    switch (toEmoji(tokens[currentToken])) {
        case '↩️':
        return [];
        case '#️⃣':
            parameter = "address"
        break;
        case '🔡':
            parameter = "string"
        break;
        case '☯️':
            parameter = "bool"
        break;
        case '🔢':
            nextToken()
            parameter = parseUint()
        break;
        default:
        console.log("Error: invalid parameter: " + toEmoji(tokens[currentToken]))
        return;
    }

    nextToken()

    let label = toEmoji(tokens[currentToken])

    nextToken()

    returnValue = parseParameter()
    returnValue.unshift({type: parameter, label: label})
    return returnValue
}

function parseFunction()
{
    if(currentToken >= tokens.length)
        return;
    
    functionName = getEmojiDescription(toEmoji(tokens[currentToken]))
    nextToken()
    functionName += getEmojiDescription(toEmoji(tokens[currentToken]))
    functionName = convertToFunctionName(functionName)
    nextToken()

    visibility = ""
    switch (toEmoji(tokens[currentToken])) {
        case '👀':
            visibility = "view"
        break;
        case '📢':
            visibility = "nonpayable"
        break;
        default:
        console.log("Error: missing function visibility")
        return;
    }

    nextToken()
    parameters = parseParameter()

    nextToken()
    returnType = ""
    switch (toEmoji(tokens[currentToken])) {
        case '#️⃣':
            returnType = "address"
        break;
        case '🔡':
            returnType = "string"
        break;
        case '☯️':
            returnType = "bool"
        break;
        case '🔢':
            nextToken()
            returnType = parseUint()
        break;
        default:
        console.log("Error: invalid return type")
        return;
    }

    nextToken()

    if(toEmoji(tokens[currentToken]) != '🏁')
    {
        console.log("Error: 🏁 expected, " + toEmoji(tokens[currentToken]) + ' found')
    }

    currentToken += 1

    var instructions = []
    while(currentToken < tokens.length
            && toEmoji(tokens[currentToken]) != '🔚')
    {
        if(toEmoji(tokens[currentToken]) == '↩️')
        {
            nextToken()
            let variable = parseVariable()
            if(variable != "")
            {
                nextToken()
                instructions.push({name: "returnLabel", value: variable})
                break
            }else
            {
                returnValue = parseNumber()
                instructions.push({name: "returnUint", value: returnValue})
                break
            }
        }else
        {
            let lValue = parseVariable()
            if(lValue != "")
            {
                nextToken()
                let rlValue = parseVariable()
                let operator = ""
                let rrValue = ""
                if(toEmoji(tokens[currentToken]) == '➖')
                {
                    operator = '➖'
                    nextToken()
                    rrValue = parseVariable()
                } else if(toEmoji(tokens[currentToken]) == '➕')
                {
                    operator = '➕'
                    nextToken()
                    rrValue = parseVariable()
                }

                instructions.push({name: "operation", lValue: lValue, rlValue: rlValue, operator: operator, rrValue: rrValue})
            }else
            {
                nextToken()
            }
        }
    }

    nextToken()

    functions.push({name: functionNameConversor(functionName), parameters: parameters, returnType: returnType, visibility: visibility, instructions: instructions})

    parseFunction()
}

function parseVariable()
{
    let variableName = []
    while(currentToken < tokens.length
        && toEmoji(tokens[currentToken]) != '📥'
        && toEmoji(tokens[currentToken]) != '➖'
        && toEmoji(tokens[currentToken]) != '➕'
        && toEmoji(tokens[currentToken]) != '🛑'
        && toEmoji(tokens[currentToken]) != '0️⃣'
        && toEmoji(tokens[currentToken]) != '1️⃣'
        && toEmoji(tokens[currentToken]) != '2️⃣'
        && toEmoji(tokens[currentToken]) != '3️⃣'
        && toEmoji(tokens[currentToken]) != '4️⃣'
        && toEmoji(tokens[currentToken]) != '5️⃣'
        && toEmoji(tokens[currentToken]) != '6️⃣'
        && toEmoji(tokens[currentToken]) != '7️⃣'
        && toEmoji(tokens[currentToken]) != '8️⃣'
        && toEmoji(tokens[currentToken]) != '9️⃣'
        )
    {
        variableName.push(toEmoji(tokens[currentToken]))
        currentToken+=1
    }
    return variableName
}

function getFunctionSignature(name, parameters)
{
    returnValue = name + "("
    for(i=0;i<parameters.length;i+=1)
    {
        if(i != 0)
        {
            returnValue+=","
        }
        returnValue+=parameters[i].type
    }
    returnValue += ")"
    return returnValue
}

const compile = async (unicodeCodePoints) => {
    currentToken = 0
    tokens = unicodeCodePoints
    functions = []

    parseFunction()

    selectorLookups = ""
    for(i=0; i<functions.length; i++)
    {
        functionSignature = getFunctionSignature(functions[i].name, functions[i].parameters)
        selectorLookups += selectorLookup(functionSignature, "j"+ String.fromCharCode(97+i))
    }
  
    functionLogics = ""
    for(i=0; i<functions.length; i++)
    {
        if(functions[i].returnType == "uint256")
        {
            functionLogics += functionIntLogic("d"+ String.fromCharCode(97+i), functions[i])
        }else if(functions[i].returnType == "string")
        {
            functionLogics += functionLogic("d"+ String.fromCharCode(97+i), functions[i])
        }else
        {
            functionLogics += functionIntLogic("d"+ String.fromCharCode(97+i), functions[i])
        }
    }
  
    contractBody = ""
    + push("j100")
    + push("j000")
    + OPCODE_JUMP
    + "d1"
    + selectorLookups
    + push("00")
    + OPCODE_DUP1
    + OPCODE_REVERT
    + functionLogics
    + "d0"
    + push("00")
    + push("0100000000000000000000000000000000000000000000000000000000")
    + push("00")
    + OPCODE_CALLDATALOAD
    + OPCODE_DIV
    + OPCODE_SWAP1
    + OPCODE_POP
    + OPCODE_SWAP1
    + OPCODE_JUMP

    //contractBody = begin + push(functionSelector) + end
    contractBodySize = intToHex(contractBody.length/2)
  
    // Setup Jump Destinations
    for(var i=0; i<contractBody.length; i+=2)
    {
      if(contractBody[i]=='j')
      {
        for(var j=0; j<contractBody.length; j+=2)
        {
          if(contractBody[j]=='d' && contractBody[j+1]==contractBody[i+1])
          {
            destinationPosition = intToHex(j/2)
            if(destinationPosition.length==2)
                destinationPosition = "00"+destinationPosition
            contractBody = modifyChar(contractBody, i, destinationPosition[0])
            contractBody = modifyChar(contractBody, i+1, destinationPosition[1])
            contractBody = modifyChar(contractBody, i+2, destinationPosition[2])
            contractBody = modifyChar(contractBody, i+3, destinationPosition[3])
            break // TODO remove this allow many jumps to one destination
          }
        }
      }
    }
  
    // Setup OPCODE_JUMPDEST
    for(var i=0; i<contractBody.length; i+=2)
    {
      if(contractBody[i]=='d')
      {
        contractBody = modifyChar(contractBody, i, '5')
        contractBody = modifyChar(contractBody, i+1, 'B')
      }
    }
  
    var abi = '['
  
    for(i=0; i<functions.length; i++)
    {
      if(i!=0)
      {
        abi += ','
      }
      abi += '{"inputs": [],"name": "'
      abi += functions[i].name
      abi += '","outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}'
    }
    abi += "]"
  
    document.getElementById("_bytecode").value = contractHeader(contractBodySize) + contractBody
    document.getElementById("_abi").value = abi
  }



function convertToFunctionName(name) {
    name = name.replace(/-/g, '');
    name = name.charAt(0).toLowerCase() + name.slice(1);
    return name
}