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
    if(functionName == "coinUpArrow")
        return "increaseAllowance"
    if(functionName == "coinDownArrow")
        return "decreaseAllowance"
    if(functionName == "coinDeliveryTruck")
        return "Transfer(address,address,uint256)"

    return functionName
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

function convertToFunctionName(name) {
    name = name.replace(/-/g, '');
    name = name.charAt(0).toLowerCase() + name.slice(1);
    return name
}