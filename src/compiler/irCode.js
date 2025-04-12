var irCode = []

function addPushJump(value) {
    irCode.push({type: "pushJump", value: value, byteSize: 3})
}

function addOpcode(value) {
    irCode.push({type: "opcode", value: value, byteSize: 1})
}


function addJumpDestination(value) {
    irCode.push({type: "jumpDestination", value: value, byteSize: 1})
}


function addBytecode(value) {
    irCode.push({type: "bytecode", value: value, byteSize: value.length/2})
}


function addPush(value) {
    irCode.push({type: "push", value: value, byteSize: 1 + value.length/2})
}

function irCodeToBytecode() {
    let bytecode = ""
    for(let i=0; i<irCode.length; i++)
    {
        let currentIrCode = irCode[i];

        switch (currentIrCode.type) {
            case 'bytecode':
                bytecode += currentIrCode.value
            break;
            case 'opcode':
                bytecode += opcodeMap.get(currentIrCode.value)
            break;
            case 'push':
                bytecode += push(currentIrCode.value)
            break;
            case 'pushJump':
                //bytecode += opcodeMap.get(currentIrCode.value)
                let destinationFound = false
                let byteIterator = 0

                for(let j=0; j<irCode.length; j++)
                {
                    if(irCode[j].type == "jumpDestination"
                        && irCode[j].value == currentIrCode.value)
                    {
                        destinationFound = true
                        break
                    }
                    byteIterator += irCode[j].byteSize
                }
                if(destinationFound)
                {
                    let jumpDestinationHex = intToHex(byteIterator)
                    if(jumpDestinationHex.length == 2)
                        jumpDestinationHex = "00" + jumpDestinationHex
                    bytecode += push(jumpDestinationHex)
                }else
                {
                    console.log("Error: Destination not found " + currentIrCode.value)
                }
            break;
            case 'jumpDestination':
                bytecode += opcodeMap.get("JUMPDEST")
            break;
            default:
            console.log("ERROR: Invalid intermediate code type " + irCode[i].type)
        }
    }

    return bytecode
}

if (typeof window == 'undefined') {
  module.exports = {
    addPushJump,
    addOpcode,
    addJumpDestination,
    addBytecode,
    addPush,
    irCodeToBytecode
  };
}