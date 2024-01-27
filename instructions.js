function push(value) {
  if(value.length == 2)
    return opcodeMap.get("PUSH1") + value
  if(value.length == 4)
    return opcodeMap.get("PUSH2") + value
  if(value.length == 6)
    return opcodeMap.get("PUSH3") + value
  if(value.length == 8)
    return opcodeMap.get("PUSH4") + value
  if(value.length == 10)
    return opcodeMap.get("PUSH5") + value

  if(value.length == 12)
    return opcodeMap.get("PUSH6") + value
  if(value.length == 14)
    return opcodeMap.get("PUSH7") + value
  if(value.length == 16)
    return opcodeMap.get("PUSH8") + value
  if(value.length == 18)
    return opcodeMap.get("PUSH9") + value
  if(value.length == 20)
    return opcodeMap.get("PUSH10") + value

  if(value.length == 22)
    return opcodeMap.get("PUSH11") + value
  if(value.length == 24)
    return opcodeMap.get("PUSH12") + value
  if(value.length == 26)
    return opcodeMap.get("PUSH13") + value
  if(value.length == 28)
    return opcodeMap.get("PUSH14") + value
  if(value.length == 30)
    return opcodeMap.get("PUSH15") + value

  if(value.length == 32)
    return opcodeMap.get("PUSH16") + value
  if(value.length == 34)
    return opcodeMap.get("PUSH17") + value
  if(value.length == 36)
    return opcodeMap.get("PUSH18") + value
  if(value.length == 38)
    return opcodeMap.get("PUSH19") + value
  if(value.length == 40)
    return opcodeMap.get("PUSH20") + value

  if(value.length == 42)
    return opcodeMap.get("PUSH21") + value
  if(value.length == 44)
    return opcodeMap.get("PUSH22") + value
  if(value.length == 46)
    return opcodeMap.get("PUSH23") + value
  if(value.length == 48)
    return opcodeMap.get("PUSH24") + value
  if(value.length == 50)
    return opcodeMap.get("PUSH25") + value

  if(value.length == 52)
    return opcodeMap.get("PUSH26") + value
  if(value.length == 54)
    return opcodeMap.get("PUSH27") + value
  if(value.length == 56)
    return opcodeMap.get("PUSH28") + value
  if(value.length == 58)
    return opcodeMap.get("PUSH29") + value
  if(value.length == 60)
    return opcodeMap.get("PUSH30") + value

  if(value.length == 62)
    return opcodeMap.get("PUSH31") + value
  if(value.length == 64)
    return opcodeMap.get("PUSH32") + value
  
  console.log("ERROR VALUE: " + value)
  return "PUSHERROR"
}

function codeCopy(destOffest, offest, size) {
  returnValue = push(size)
    + push(offest)
    + push(destOffest)
    + opcodeMap.get("CODECOPY")
  return returnValue
}

function rReturn(offset, size) {
  returnValue = push(size)
    + push(offset)
    + opcodeMap.get("RETURN")
  return returnValue
}

function returnLiteral(value, size) {
  let returnValue = push(value) // Return true
        + storeTopOfStackInMemory("00")
        + rReturn("00", size)
  return returnValue
}

function returnLabel(label, size) {
  let returnValue = putValueOnStack(label, false/* wtf is this */) // Return true
        + storeTopOfStackInMemory("00")
        + rReturn("00", size)
  return returnValue
}

function keccak256(offset, size) {
  returnValue = push(size)
    + push(offset)
    + opcodeMap.get("KECCAK256")
  return returnValue
}

function putLabelOnStack(label, performSizeAdjustement) {
  if(label == '👤') {
    let senderOnTopOfStack = putSenderOnStack()
    return senderOnTopOfStack
  }

  let returnValue = ""

  let size

  if(labelMap.has(label))
  {
    let position = labelMap.get(label).position
    size = labelMap.get(label).size
    returnValue += push(position)
    if(labelMap.get(label).location == "calldata") {
      returnValue += opcodeMap.get("CALLDATALOAD")
    } else if(labelMap.get(label).location == "memory") {
      returnValue += opcodeMap.get("MLOAD")
    } else
    {
      console.log("ERROR: Invalid location, expected calldata or memory")
    }
  }else if(stateVariables.has(label))
  {
    size = 32
    let slot = stateVariables.get(label).position
    returnValue += push(intToHex(slot))
      + opcodeMap.get("SLOAD")
  }else
  {
    console.log("Error: Could not find label on the calldata nor state: " + label)
  }

  if(performSizeAdjustement && size != 32)
  {
    let sizeAdjustement = "01"
    for (let i = 0; i < 32-size; i++) {
      sizeAdjustement += "00";
    }
    returnValue += push(sizeAdjustement)
      + opcodeMap.get("MUL")
  }

  return returnValue
}

function putSenderOnStack() {
  
  let returnValue =  opcodeMap.get("CALLER") // Get my address
  //+ push("01000000000000000000000000")
  //+ opcodeMap.get("MUL")

  return returnValue
}

function putMappingValueOnStack(mapLocation, keyLabel, keySize, performSizeAdjustement) {
  let returnValue = putLabelOnStack(keyLabel, performSizeAdjustement)
    + storeTopOfStackInMemory("00")
    + push(mapLocation) // TODO: Need to allow more than 16 mappings
    + storeTopOfStackInMemory(intToHex(keySize))
    + keccak256("00", intToHex(keySize + 32))
    + opcodeMap.get("SLOAD")

  return returnValue
}

function putLabelValueOnState(label) {
  let slot = ""
  let location = "state"
  if(stateVariables.has(label))
  {
    slot = stateVariables.get(label).position
  }else if(labelMap.has(label))
  {
    slot = labelMap.get(label).position
    location = labelMap.get(label).location
  }else
  {
    console.log("Error: Could not find label on state while trying to store: " + label)
  }
  let returnValue = push(intToHex(slot))
  if(location == "state")
  {
    returnValue += opcodeMap.get("SSTORE")
  }else if(location == "memory")
  {
    returnValue += opcodeMap.get("MSTORE")
  }
  return returnValue
}

function putMappingValueOnState(mapLocation, keyLabel, keySize, performSizeAdjustement) {
  let returnValue = putLabelOnStack(keyLabel, performSizeAdjustement)
    + storeTopOfStackInMemory("00")
    + push(mapLocation) // TODO: Need to allow more than 16 mappings
    + storeTopOfStackInMemory(intToHex(keySize))
    + keccak256("00", intToHex(keySize + 32))
    + opcodeMap.get("SSTORE")
  return returnValue
}

function put2dMappingValueOnStack(mapLocation, keyLabelA, keyLabelB, keySize, performSizeAdjustement) {
  let returnValue = putLabelOnStack(keyLabelA, performSizeAdjustement)
    + storeTopOfStackInMemory("00")
    + putLabelOnStack(keyLabelB, performSizeAdjustement)
    + storeTopOfStackInMemory(intToHex(32))
    + push(mapLocation)
    + storeTopOfStackInMemory(intToHex(64))
    + keccak256("00", intToHex(32 * 3))
    + opcodeMap.get("SLOAD")
  return returnValue
}

function put2dMappingValueOnState(mapLocation, keyLabelA, keyLabelB, keySize, performSizeAdjustement) {
  let returnValue = putLabelOnStack(keyLabelA, performSizeAdjustement)
    + storeTopOfStackInMemory("00")
    + putLabelOnStack(keyLabelB, performSizeAdjustement)
    + storeTopOfStackInMemory(intToHex(32))
    + push(mapLocation)
    + storeTopOfStackInMemory(intToHex(64))
    + keccak256("00", intToHex(32 * 3))
    + opcodeMap.get("SSTORE")
  return returnValue
}

function putValueOnStack(label, performSizeAdjustement) {

  if(label.length == 1)
  {
    return putLabelOnStack(label[0], performSizeAdjustement)
  }else if(label.length == 2)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    return putMappingValueOnStack(mapLocation, label[1], 20, performSizeAdjustement) // currently only address arrays
  }else if(label.length == 3)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    return put2dMappingValueOnStack(mapLocation, label[1], label[2], 20, performSizeAdjustement) // currently only address arrays
  }else{
    console.log("Error: Invalid label length while trying to put it on stack")
  }
}

function putValueOnState(label, performSizeAdjustement) {

  if(label.length == 1)
  {
    return putLabelValueOnState(label[0])
  }else if(label.length == 2)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    return putMappingValueOnState(mapLocation, label[1], 20, performSizeAdjustement) // TODO: Currently on array mappins
  }else if(label.length == 3)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    return put2dMappingValueOnState(mapLocation, label[1], label[2], 20, performSizeAdjustement) // TODO: Currently on array mappins
  }else{
    console.log("Error: Invalid label length while triying to put it on state")
  }
}

function storeTopOfStackInMemory(offset) {
  let returnValue = push(offset)
    + opcodeMap.get("MSTORE")
  return returnValue
}

function operation(lValue, rlValue, operator, rrValue) // lValue = rlValue [Operator] rrValue
{
  let returnValue = ""
  if(Array.isArray(rrValue)) {
    returnValue += putValueOnStack(rrValue, false/* wtf is this */)
  } else {
    returnValue += push(intToHex(rrValue))
  }
  returnValue += putValueOnStack(rlValue, false/* wtf is this */)
  if(operator == '➕')
  {
    returnValue += opcodeMap.get("ADD")
  }else if(operator == '➖')
  {
    returnValue += opcodeMap.get("DUP1") // Uint underflow prevention
    returnValue += opcodeMap.get("DUP3")
    returnValue += opcodeMap.get("GT")
    returnValue += push("jR00")
    returnValue += opcodeMap.get("JUMPI")

    returnValue += opcodeMap.get("SUB")
  }
  returnValue += putValueOnState(lValue, false/* wtf is this */)
  return returnValue
}

function assignment(lValue, rValue) // lValue = rValue
{
  let returnValue = ""
  returnValue += putValueOnStack(rValue, false/* wtf is this */)
  returnValue += putValueOnState(lValue, false/* wtf is this */)
  return returnValue
}

function literalAssignment(lValue, rValue) // lValue = rValue
{
  let returnValue = ""
  returnValue += push(rValue)
  returnValue += putValueOnState(lValue, false/* wtf is this */)
  return returnValue
}

  // TODO: Implement logs
function logEvent(topics)
{
  let eventSignature = getEmojiDescription(topics[0][0]) + getEmojiDescription(topics[0][1])
  eventSignature = functionNameConversor(convertToFunctionName(eventSignature))
  let eventSignatureHash = getSelector(eventSignature).toUpperCase()

  let topic0 = eventSignatureHash
  let topic1 = topics[1]
  let topic2 = topics[2]
  let data = topics[3]

  let returnValue = ""
  if(Array.isArray(data))
    returnValue += putValueOnStack(data, false)
  else
    returnValue += push(intToHex(parseInt(data)))

  returnValue += storeTopOfStackInMemory("00")

  if(Array.isArray(topic2))
    returnValue += putValueOnStack(topic2, false)
  else
    returnValue += push(intToHex(parseInt(topic2)))

  if(Array.isArray(topic1))
    returnValue += putValueOnStack(topic1, false)
  else
    returnValue += push(intToHex(parseInt(topic1)))

  returnValue += push(topic0)
    + push(intToHex(32))
    + push("00")
    + opcodeMap.get("LOG3")

  return returnValue
}