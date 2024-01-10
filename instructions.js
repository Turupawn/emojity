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

function keccak256(offset, size) {
  returnValue = push(size)
    + push(offset)
    + OPCODE_KECCAK256
  return returnValue
}
