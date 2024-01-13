function push(value) {
  if(value.length == 2)
    return OPCODE_PUSH1 + value
  if(value.length == 4)
    return OPCODE_PUSH2 + value
  if(value.length == 6)
    return OPCODE_PUSH3 + value
  if(value.length == 8)
    return OPCODE_PUSH4 + value
  if(value.length == 10)
    return OPCODE_PUSH5 + value

  if(value.length == 12)
    return OPCODE_PUSH6 + value
  if(value.length == 14)
    return OPCODE_PUSH7 + value
  if(value.length == 16)
    return OPCODE_PUSH8 + value
  if(value.length == 18)
    return OPCODE_PUSH9 + value
  if(value.length == 20)
    return OPCODE_PUSH10 + value

  if(value.length == 22)
    return OPCODE_PUSH11 + value
  if(value.length == 24)
    return OPCODE_PUSH12 + value
  if(value.length == 26)
    return OPCODE_PUSH13 + value
  if(value.length == 28)
    return OPCODE_PUSH14 + value
  if(value.length == 30)
    return OPCODE_PUSH15 + value

  if(value.length == 32)
    return OPCODE_PUSH16 + value
  if(value.length == 34)
    return OPCODE_PUSH17 + value
  if(value.length == 36)
    return OPCODE_PUSH18 + value
  if(value.length == 38)
    return OPCODE_PUSH19 + value
  if(value.length == 40)
    return OPCODE_PUSH20 + value

  if(value.length == 42)
    return OPCODE_PUSH21 + value
  if(value.length == 44)
    return OPCODE_PUSH22 + value
  if(value.length == 46)
    return OPCODE_PUSH23 + value
  if(value.length == 48)
    return OPCODE_PUSH24 + value
  if(value.length == 50)
    return OPCODE_PUSH25 + value

  if(value.length == 52)
    return OPCODE_PUSH26 + value
  if(value.length == 54)
    return OPCODE_PUSH27 + value
  if(value.length == 56)
    return OPCODE_PUSH28 + value
  if(value.length == 58)
    return OPCODE_PUSH29 + value
  if(value.length == 60)
    return OPCODE_PUSH30 + value

  if(value.length == 62)
    return OPCODE_PUSH31 + value
  if(value.length == 64)
    return OPCODE_PUSH32 + value
  
  console.log("ERROR VALUE: " + value)
  return "PUSHERROR"
}

function codeCopy(destOffest, offest, size) {
  returnValue = push(size)
    + push(offest)
    + push(destOffest)
    + OPCODE_CODECOPY
  return returnValue
}

function rReturn(offset, size) {
  returnValue = push(size)
    + push(offset)
    + OPCODE_RETURN
  return returnValue
}

function returnLiteral(value, size) {
  let returnValue = push(value) // Return true
        + storeTopOfStackInMemory("00")
        + rReturn("00", size)
  return returnValue
}

function returnLabel(label, size) {
  let returnValue = putValueOnStack(label) // Return true
        + storeTopOfStackInMemory("00")
        + rReturn("00", size)
  return returnValue
}

function keccak256(offset, size) {
  returnValue = push(size)
    + push(offset)
    + OPCODE_KECCAK256
  return returnValue
}

function putLabelOnStack(label) {
  if(label == '👤') {
    let senderOnTopOfStack = putSenderOnStack()
    return senderOnTopOfStack
  }
  let calldataLocation = labelMap.get(label).calldataLocation
  let size = labelMap.get(label).size

  let returnValue = push(calldataLocation) // Put address on memory
    + OPCODE_CALLDATALOAD
  if(size != 32)
  {
    let sizeAdjustement = "01"
    for (let i = 0; i < 32-size; i++) {
      sizeAdjustement += "00";
    }
    returnValue += push(sizeAdjustement)
      + OPCODE_MUL
  }

  return returnValue
}

function putSenderOnStack() {
  
  let returnValue =  OPCODE_CALLER // Get my address
  + push("01000000000000000000000000")
  + OPCODE_MUL

  return returnValue
}

function putMappingValueOnStack(keyLabel, keySize) {
  let returnValue = putLabelOnStack(keyLabel)
    + storeTopOfStackInMemory("00")
    + keccak256("00", keySize) // Get my balance key
    + OPCODE_SLOAD // Get my balance

  return returnValue
}

function putMappingValueOnState(keyLabel, keySize) {
  let returnValue = putLabelOnStack(keyLabel)
    + storeTopOfStackInMemory("00")
    + keccak256("00", keySize) // Get my balance key
    + OPCODE_SSTORE // Get my balance
  return returnValue
}

function putValueOnStack(label) {

  if(label.length == 1)
  {
    return putLabelOnStack(label[0])
  }else if(label.length == 2)
  {
    return putMappingValueOnStack(label[1], intToHex(20))
  }else{
    console.log("Error: Invalid label length while trying to put it on stack")
  }
}

function putValueOnState(label) {

  if(label.length == 1)
  {
    //return putLabelOnState(label[0])
    // TODO: IMPLEMENT THIS
  }else if(label.length == 2)
  {
    return putMappingValueOnState(label[1], intToHex(20))
  }else{
    console.log("Error: Invalid label length while triying to put it on state")
  }
}

function storeTopOfStackInMemory(offset) {
  let returnValue = push(offset)
    + OPCODE_MSTORE
  return returnValue
}

function operation(lValue, rlValue, operator, rrValue) // lValue = rlValue [Operator] rrValue
{
  let returnValue = ""
  returnValue += putValueOnStack(rrValue)
  returnValue += putValueOnStack(rlValue)
  if(operator == '➕')
  {
    returnValue += OPCODE_ADD
  }else if(operator == '➖')
  {
    returnValue += OPCODE_SUB
  }
  returnValue += putValueOnState(lValue)
  return returnValue
}

function assignment(lValue, rValue) // lValue = rValue
{
  console.log(lValue)
  console.log(rValue)
  let returnValue = ""
  returnValue += putValueOnStack(rValue)
  returnValue += putValueOnState(lValue)
  return returnValue
}