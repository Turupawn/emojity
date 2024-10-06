function erc20NameConversor(functionName)
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

    return null;
}

function erc721NameConversor(functionName)
{
    //console.log(functionName)
    if(functionName == "XX")
        return "balanceOf"
    if(functionName == "framedPictureCrown")
        return "ownerOf"
    if(functionName == "XX")
        return "safeTransferFrom"
    if(functionName == "framedPictureAtmSign")
        return "transferFrom"
    if(functionName == "framedPictureWhiteHeavyCheckMark")
        return "approve"
    if(functionName == "framedPictureJoystick")
        return "setApprovalForAll"
    if(functionName == "framedPicturePassportControl")
        return "getApproved"
    if(functionName == "framedPictureOKButton")
        return "isApprovedForAll"
    if(functionName == "framedPictureNameBadge")
        return "name"
    if(functionName == "framedPictureIDButton")
        return "symbol"
    if(functionName == "framedPictureGlobeWithMeridians")
        return "tokenURI"
    if(functionName == "framedPictureDeliveryTruck")
        return "Transfer(address,address,uint256)"
    if(functionName == "XX")
        return "Approval(address,address,uint256)"
    if(functionName == "XX")
        return "ApprovalForAll(address,address,bool)"
}

function functionNameConversor(functionName)
{
    let erc20Name = erc20NameConversor(functionName)
    if(erc20Name)
        return erc20Name;
    let erc721Name = erc721NameConversor(functionName)
    if(erc721Name)
        return erc721Name;
    return functionName;
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