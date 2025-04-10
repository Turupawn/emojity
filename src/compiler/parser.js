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

function parseInstructions()
{
    let instructions = []
    while(currentToken < tokens.length
            && toEmoji(tokens[currentToken]) != '🔚')
    {
        if(toEmoji(tokens[currentToken]) == '↩️')
        {
            nextToken()
            let returnedValue = parseVariable()
            if(returnedValue != "")
                nextToken()
            else
                returnedValue = BigInt(parseNumber())
            instructions.push({name: "return", value: returnedValue})
            break;
        }else if(toEmoji(tokens[currentToken]) == '📑')
        {
            let topics = []
            while(toEmoji(tokens[currentToken]) == '📑')
            {
                nextToken()
                let variable = parseVariable()
                if(variable != "")
                {
                    topics.push(variable)
                }else
                {
                    number = BigInt(parseNumber())
                    topics.push(number)
                }
            }
            instructions.push({name: "logEvent", topics})
        } else if(toEmoji(tokens[currentToken]) == '❓'){
            nextToken()
            let condition = parseVariable()
            while(toEmoji(tokens[currentToken]) == '🏁'
                || toEmoji(tokens[currentToken]) == '🛑')
            {
                nextToken()
            }
            let ifConditions = parseInstructions()
            nextToken()

            instructions.push({name: "ifStatement", condition: condition, instructions: ifConditions})
        } else if(toEmoji(tokens[currentToken]) == '🔄'){
            nextToken()
            let condition = parseVariable()
            nextToken()
            nextToken()
            let instructionsLoop = parseInstructions()
            nextToken()
            instructions.push({name: "whileLoop", condition: condition, instructions: instructionsLoop})
        } else if(toEmoji(tokens[currentToken]) == '🔢')
        {
            nextToken()
            let label = parseVariable()
            instructions.push({name: "declareUint", label: label, type: "uint"})
        } else if(toEmoji(tokens[currentToken]) == '#️⃣')
        {
            nextToken()
            let label = parseVariable()
            instructions.push({name: "declareAddress", label: label, type: "address"})
        } else if(toEmoji(tokens[currentToken]) == '🔡')
        {
            nextToken()
            let label = parseVariable()
            instructions.push({name: "declareString", label: label, type: "string"})
        }else if(toEmoji(tokens[currentToken]) == '☯️')
        {
            nextToken()
            let label = parseVariable()
            instructions.push({name: "declareBool", label: label, type: "bool"})
        }else if(toEmoji(tokens[currentToken]) == '📡')
        {
            nextToken()
            let contractAddress = parseNumber()
            let contractAddressType = "literal"
            if(contractAddress == "")
            {
                contractAddress = [''+toEmoji(tokens[currentToken])]
                contractAddressType = "variable"
                nextToken()
            } else {
                contractAddress = BigInt(contractAddress)
            }
            nextToken()
            let selector = parseNumber()
            let selectorType = "literal"
            if(selector == "")
            {
                selector = [''+toEmoji(tokens[currentToken])]
                selectorType = "variable"
                nextToken()
            } else {
                selector = BigInt(selector)
            }
            nextToken()
            let ethValue = parseNumber()
            let ethValueType = "literal"
            if(ethValue == "")
            {
                ethValue = [''+toEmoji(tokens[currentToken])]
                ethValueType = "variable"
                nextToken()
            } else {
                ethValue = BigInt(ethValue)
            }
            nextToken()
            let gas = parseNumber()
            let gasType = "literal"
            if(gas == "")
            {
                gas = [''+toEmoji(tokens[currentToken])]
                gasType = "variable"
                nextToken()
            } else {
                gas = BigInt(gas)
            }

            let params = []
            while(toEmoji(tokens[currentToken]) == '#️⃣'
                    || toEmoji(tokens[currentToken]) == '🔢')
            {
                nextToken()
                let value = parseNumber()
                let type = "literal"
                if(value=="")
                {
                    value = parseVariable()
                    type = "variable"
                } else {
                    value = BigInt(value)
                }
                params.push({type: type, value: value})
            }

            let returnValueStorage = null;
            if(toEmoji(tokens[currentToken]) == '📥')
            {
                nextToken()
                returnValueStorage = [''+toEmoji(tokens[currentToken])]
                nextToken()
            }

            instructions.push({name: "externalCall",
                contractAddress: {value: contractAddress, type: contractAddressType},
                selector: {value: selector, type: selectorType},
                value: {value: ethValue, type: ethValueType},
                gas: {value: gas, type: gasType},
                params: params,
                returnValueStorage: returnValueStorage
            })
        }else if(toEmoji(tokens[currentToken]) == '❌')
        {
            instructions.push({name: "revert"})
            nextToken()
        }else
        {
            let lValue = parseVariable()
            if(lValue != "")
            {
                let numberStr = parseNumber();
                let mappingPositionLiteral = null;
                if(numberStr != "")
                    mappingPositionLiteral = BigInt(numberStr);
                if(mappingPositionLiteral != null)
                    lValue.push(mappingPositionLiteral)

                nextToken()

                let rlValue = parseVariable()
                if(rlValue!="")
                {
                    let operator = ""
                    let rrValue = ""
                    if(toEmoji(tokens[currentToken]) == '➖')
                    {
                        operator = '➖'
                    } else if(toEmoji(tokens[currentToken]) == '➕')
                    {
                        operator = '➕'
                    } else if(toEmoji(tokens[currentToken]) == '✖️')
                    {
                        operator = '✖️'
                    } else if(toEmoji(tokens[currentToken]) == '➗')
                    {
                        operator = '➗'
                    } else if(toEmoji(tokens[currentToken]) == '⬆️')
                    {
                        operator = '⬆️'
                    } else if(toEmoji(tokens[currentToken]) == '⬇️')
                    {
                        operator = '⬇️'
                    } else if(toEmoji(tokens[currentToken]) == '🟰')
                    {
                        operator = '🟰'
                    }

                    if(operator != "") {
                        nextToken()
                        rrValue = parseVariable()
                        if(rrValue == "")
                        {
                            rrValue = BigInt(parseNumber())
                        }
                        if(rrValue === "")
                        {
                            console.log("Error: invalid rrValue while parsing operation")
                        }
                        instructions.push({name: "operation", lValue: lValue, rlValue: rlValue, operator: operator, rrValue: rrValue})
                    } else
                    {
                        instructions.push({name: "assignment", lValue: lValue, rValue: rlValue})
                    }
                } else {

                    rlValue = parseNumber()
                    if(rlValue!="")
                    {
                        instructions.push({name: "literalAssignment", lValue: lValue, rValue: BigInt(rlValue)})
                    } else {
                        console.log("Error: Could not parse instruction")
                    }
                }
            }else
            {
                nextToken()
            }
        }
    }

    return instructions
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
            console.log("Error: missing function visibility found " + toEmoji(tokens[currentToken]))
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

    let instructions = parseInstructions()

    for(let i=0; i<instructions.length; i++)
    {
        if(instructions[i].name == "returnLiteral")
        {
            instructions[i].returnType = returnType
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
        && toEmoji(tokens[currentToken]) != '✖️'
        && toEmoji(tokens[currentToken]) != '🟰'
        && toEmoji(tokens[currentToken]) != '➗'
        && toEmoji(tokens[currentToken]) != '⬆️'
        && toEmoji(tokens[currentToken]) != '⬇️'
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
        && toEmoji(tokens[currentToken]) != '📑'
        && toEmoji(tokens[currentToken]) != '#️⃣'
        && toEmoji(tokens[currentToken]) != '🔡'
        && toEmoji(tokens[currentToken]) != '☯️'
        && toEmoji(tokens[currentToken]) != '🔢'
        && toEmoji(tokens[currentToken]) != '❌'
        && toEmoji(tokens[currentToken]) != '📡'
        )
    {
        variableName.push(toEmoji(tokens[currentToken]))
        currentToken+=1
    }
    return variableName
}

function parseStateVariable()
{
    let type = ""
    let variableSize = 0;

    switch (toEmoji(tokens[currentToken])) {
        case '🗺️':
            type = "mapping"
            variableSize = 32
        break
        case '#️⃣':
            type = "address"
            variableSize = 20
        break;
        case '🔡':
            type = "string"
            variableSize = 32
        break;
        case '☯️':
            type = "bool"
            variableSize = 1
        break;
        case '🔢':
            nextToken()
            type = parseUint()
            variableSize = 32
            //parameter = parseUint()
        break;
    }

    if(type == "")
    {
        return false
    }

    nextToken()

    let label = toEmoji(tokens[currentToken])

    nextToken()

    stateVariables.set(label, {type: type, position: stateVariables.size, size: variableSize, description: getEmojiDescription(label).toUpperCase()})
    return true
}

function parseConstructor() {
    if(toEmoji(tokens[currentToken]) != '👷')
        return
    nextToken()
    if(toEmoji(tokens[currentToken]) != '🏁')
    {
        console.log("Error: 🏁 expected in constructor")
        return
    }
    nextToken()
    constructorInstructions = parseInstructions()

    if(toEmoji(tokens[currentToken]) != '🔚')
    {
        console.log("Error: 🔚 expected at the end of constructor")
        return
    }
    nextToken()
}