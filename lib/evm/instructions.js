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

function codeCopy(destOffest, offset, size) {
  addPush(size)
  addPush(offset)
  addPush(destOffest)
  addOpcode("CODECOPY")
}

function rReturn(offset, size) {
  addPush(size)
  addPush(offset)
  addOpcode("RETURN")
}

function returnLiteral(value, size) {
  addPush(value)
  let memoryLocation = allocateMemory(size)
  storeTopOfStackInMemory(memoryLocation)
  rReturn(intToHex(memoryLocation), intToHex(size))
}

function returnStringLiteral(stringUintRepresentation) {
  let stringHexRepresentation = intToHex(parseInt(stringUintRepresentation))
  let stringLength = intToHex(stringHexRepresentation.length/2)

  while(stringHexRepresentation.length < 64)
  {
    stringHexRepresentation += "0"
  }

  addPush("20")// start of string position
  addPush("00")
  addOpcode("MSTORE")
  addPush(stringLength)
  addPush("20")
  addOpcode("MSTORE")
  addPush(stringHexRepresentation)
  addPush("40")
  addOpcode("MSTORE")
  rReturn("00", "60")
}

function returnLabel(label, size) {
  putValueOnStack(label, false/* wtf is this */)
  let memoryLocation = allocateMemory(size)
  storeTopOfStackInMemory(memoryLocation)
  rReturn(intToHex(memoryLocation), intToHex(size))
}

function keccak256(offset, size) {
  addPush(size)
  addPush(offset)
  addOpcode("KECCAK256")
}

function putLabelOnStack(label, performSizeAdjustement) {
  if(label == '👤') {
    putSenderOnStack()
    return
  } else if(label == '👇') {
    putThisOnStack()
    return
  } else if(label == '💰')
  {
    putCallValueOnStack()
    return
  }

  let size

  if(labelMap.has(label))
  {
    let position = labelMap.get(label).position
    size = labelMap.get(label).size
    addPush(position)
    if(labelMap.get(label).location == "calldata") {
      addOpcode("CALLDATALOAD")
    } else if(labelMap.get(label).location == "memory") {
      addOpcode("MLOAD")
    } else
    {
      console.log("ERROR: Invalid location, expected calldata or memory")
    }
  }else if(stateVariables.has(label))
  {
    size = 32
    let slot = stateVariables.get(label).position
    addPush(intToHex(slot))
    addOpcode("SLOAD")
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
    addPush(sizeAdjustement)
    addOpcode("MUL")
  }
}

function putSenderOnStack() {
  addOpcode("CALLER")
}

function putCallValueOnStack() {
  addOpcode("CALLVALUE")
}

function putThisOnStack() {
  addOpcode("ADDRESS")
}

function putMappingValueOnStack(mapLocation, keyLabel, keySize, performSizeAdjustement) {
  putLabelOnStack(keyLabel, performSizeAdjustement)
  let memoryLocation = allocateMemory(keySize)
  storeTopOfStackInMemory(memoryLocation)
  addPush(mapLocation) // TODO: Need to allow more than 16 mappings
  let memoryLocation2 = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation2)
  keccak256(intToHex(memoryLocation), intToHex(keySize + 32))
  addOpcode("SLOAD")
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
  addPush(intToHex(slot))
  if(location == "state")
  {
    addOpcode("SSTORE")
  }else if(location == "memory")
  {
    addOpcode("MSTORE")
  }
}

function putMappingValueOnState(mapLocation, keyLabel, keySize, performSizeAdjustement) {
  putLabelOnStack(keyLabel, performSizeAdjustement)
  let memoryLocation = allocateMemory(keySize) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation)
  addPush(mapLocation) // TODO: Need to allow more than 16 mappings
  let memoryLocation2 = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation2)
  keccak256(intToHex(memoryLocation), intToHex(keySize + 32))
  addOpcode("SSTORE")
}

function put2dMappingValueOnStack(mapLocation, keyLabelA, keyLabelB, keySize, performSizeAdjustement) {
  putLabelOnStack(keyLabelA, performSizeAdjustement)
  let memoryLocation1 = allocateMemory(keySize) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation1)
  putLabelOnStack(keyLabelB, performSizeAdjustement)
  let memoryLocation2 = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation2)
  addPush(mapLocation)
  let memoryLocation3 = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation3)
  keccak256(intToHex(memoryLocation1), intToHex(32 * 3))
  addOpcode("SLOAD")
}

function put2dMappingValueOnState(mapLocation, keyLabelA, keyLabelB, keySize, performSizeAdjustement) {
  putLabelOnStack(keyLabelA, performSizeAdjustement)
  let memoryLocation1 = allocateMemory(keySize) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation1)
  putLabelOnStack(keyLabelB, performSizeAdjustement)
  let memoryLocation2 = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation2)
  addPush(mapLocation)
  let memoryLocation3 = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
  storeTopOfStackInMemory(memoryLocation3)
  keccak256(intToHex(memoryLocation1), intToHex(32 * 3))
  addOpcode("SSTORE")
}

function putValueOnStack(label, performSizeAdjustement) {

  if(label.length == 1)
  {
    putLabelOnStack(label[0], performSizeAdjustement)
    return
  }else if(label.length == 2)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    putMappingValueOnStack(mapLocation, label[1], 20, performSizeAdjustement) // TODO: currently only address arrays
    return
  }else if(label.length == 3)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    put2dMappingValueOnStack(mapLocation, label[1], label[2], 20, performSizeAdjustement) // currently only address arrays
    return
  }else{
    console.log("Error: Invalid label length while trying to put it on stack")
  }
}

function putValueOnState(label, performSizeAdjustement) {

  if(label.length == 1)
  {
    putLabelValueOnState(label[0])
    return
  }else if(label.length == 2)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    putMappingValueOnState(mapLocation, label[1], 20, performSizeAdjustement) // TODO: Currently only address mappins
    return
  }else if(label.length == 3)
  {
    let mapLocation = intToHex(stateVariables.get(label[0]).position)
    put2dMappingValueOnState(mapLocation, label[1], label[2], 20, performSizeAdjustement) // TODO: Currently on array mappins
    return
  }else{
    console.log("Error: Invalid label length while triying to put it on state")
  }
}

function storeTopOfStackInMemory(offset) {
  addPush(intToHex(offset))
  addOpcode("MSTORE")
}

function operation(lValue, rlValue, operator, rrValue) // lValue = rlValue [Operator] rrValue
{
  if(Array.isArray(rrValue)) {
    putValueOnStack(rrValue, false/* wtf is this */)
  } else {
    addPush(intToHex(rrValue))
  }
  putValueOnStack(rlValue, false/* wtf is this */)
  if(operator == '➕')
  {
    addOpcode("ADD")
  }else if(operator == '➖')
  {
    addOpcode("DUP1") // Uint underflow prevention
    addOpcode("DUP3")
    addOpcode("GT")
    addPushJump(revertDestination)
    addOpcode("JUMPI")
    addOpcode("SUB")
  }
  putValueOnState(lValue, false/* wtf is this */)
}

function assignment(lValue, rValue) // lValue = rValue
{
  putValueOnStack(rValue, false/* wtf is this */)
  putValueOnState(lValue, false/* wtf is this */)
}

function literalAssignment(lValue, rValue) // lValue = rValue
{
  addPush(rValue)
  putValueOnState(lValue, false/* wtf is this */)
}

function logEvent(topics)
{
  let eventSignature = getEmojiDescription(topics[0][0]) + getEmojiDescription(topics[0][1])
  eventSignature = functionNameConversor(convertToFunctionName(eventSignature))
  let eventSignatureHash = getSelector(eventSignature).toUpperCase()

  for(let i=topics.length-1; i>0 /* the topic 0 is the event signature */ ; i--)
  {
    let currentTopic = topics[i]
    if(Array.isArray(currentTopic))
      putValueOnStack(currentTopic, false)
    else
      addPush(intToHex(parseInt(currentTopic)))
    
    if(i == topics.length-1) // the last topic is implemented in the data :shrug:
    {
      let memoryLocation = allocateMemory(32) // TODO: Same memory block should be enforced to ensure correct hashing
      storeTopOfStackInMemory(memoryLocation)
    }
  }

  addPush(eventSignatureHash)
  addPush(intToHex(32))
  addPush("00")
  switch (topics.length-1) { // -1 due to not counting the signature
      case 1:
        addOpcode("LOG1")
        break;
      case 2:
        addOpcode("LOG2")
        break;
      case 3:
        addOpcode("LOG3")
        break;
      case 4:
        addOpcode("LOG4")
        break;
      default:
      console.log("Log parameter count: " (topics.length-1))
      return;
  }
}

function ifStatement(condition, instructionsParam) {
  putValueOnStack(condition, false/* wtf is this */)
  addOpcode("ISZERO")
  let endOfIfDestination = currentJumpDestination
  nextJumpDestination()
  addPushJump(endOfIfDestination)
  nextJumpDestination()
  addOpcode("JUMPI")
  convertInstructionToBytecode(instructionsParam)
  addJumpDestination(endOfIfDestination)
}

function whileLoop(condition, instructionsParam) {
  let startOfWhileDestination = currentJumpDestination
  nextJumpDestination()
  addJumpDestination(startOfWhileDestination)
  putValueOnStack(condition, false/* wtf is this */)
  addOpcode("ISZERO")
  let endOfWhileDestination = currentJumpDestination
  nextJumpDestination()
  addPushJump(endOfWhileDestination)
  nextJumpDestination()
  addOpcode("JUMPI")
  convertInstructionToBytecode(instructionsParam)
  addPushJump(startOfWhileDestination)
  addOpcode("JUMP")
  addJumpDestination(endOfWhileDestination)
}