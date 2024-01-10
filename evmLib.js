var web3
const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)
        window.location.reload()
        resolve(web3)
      } else {
        reject("must install MetaMask")
        document.getElementById("web3_message").textContent="Error: Porfavor conéctate a Metamask";
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
        }
      });
    }
  });
};
async function loadWeb3() {
  web3 = await getWeb3()
}
loadWeb3()

function getSelector(functionName) {
    let hash = web3.utils.soliditySha3(web3.utils.toHex(functionName))
    return hash.substring(2).substring(0, 8)
  }
  
  function contractHeader(contractSize) {
    let deltaWithoutContractSizeAdjutment = 45
    offset = intToHex((deltaWithoutContractSizeAdjutment + (contractSize.length*3)/2))
    while(contractSize.length > offset.length)
    {
      offset = "00" + offset
    }

    returnValue = ""// Constructor
      + push("3635C9ADC5DEA00000") // Token amount
      + OPCODE_CALLER // msg.sender
      + push("01000000000000000000000000")
      + OPCODE_MUL
      + push("00")
      + OPCODE_MSTORE
      + keccak256("00", "14") // Get Key Position
      + OPCODE_SSTORE // Store new value
      + codeCopy("00", offset, contractSize)
      + rReturn("00", contractSize)
      + OPCODE_INVALID

    console.log("Offset: " + deltaWithoutContractSizeAdjutment )
    console.log("Length: " + (returnValue.length- contractSize.length*3)/2)

    if(deltaWithoutContractSizeAdjutment != (returnValue.length- contractSize.length*3)/2)
    {
      console.log("Error: Invalid contract delta size adjustment")
    }

    return returnValue
  }
  
  function intToHex(num) {

    returnValue = (num).toString(16).toUpperCase()

    if(returnValue.length%2 != 0)
    {
      returnValue = "0" + returnValue
    }
    return returnValue
  }
  
  function modifyChar(originalString, index, newChar) {
    if (index < 0 || index >= originalString.length) {
        // Index out of bounds
        return originalString;
    }
  
    // Create a new string with the modified character
    return (
        originalString.substr(0, index) + newChar + originalString.substr(index + 1)
    );
  }
  
  function selectorLookup(signature, destination) {
    if(destination.length==2)
      destination = destination+"00"

    returnValue =  push(getSelector(signature).toUpperCase())
      + OPCODE_DUP2
      + OPCODE_EQ
      + push(destination)
      + OPCODE_JUMPI
  
    return returnValue
  }
  
  function functionLogic(jumpLocation, returnValue, instructions)
  {
    let literalValue = intToHex(parseInt(instructions[0].value))
    let literalInstructionLength = intToHex(literalValue.length/2)
    console.log(instructions[0].value)
    while(literalValue.length < 64)
    {
      literalValue+="0"
    }
    
    returnValue = jumpLocation
      + push("20")//start?
      + push("00")
      + OPCODE_MSTORE
      + push(literalInstructionLength)// length
      + push("20")
      + OPCODE_MSTORE
      + push(literalValue)
      + push("40")
      + OPCODE_MSTORE
      + rReturn("00", "60")
    return returnValue
  }

  function functionIntLogic(jumpLocation, returnValue, instructions) // getBalance
  {
    hexReturnValue = intToHex(parseInt(instructions[0].value))
    if(instructions[0].value == "1000000000000000000")
    {
      returnValue = jumpLocation
      + push("04")
      + OPCODE_CALLDATALOAD
      + push("01000000000000000000000000")
      + OPCODE_MUL
      + push("00")
      + OPCODE_MSTORE
      + keccak256("00", "14")
      + OPCODE_SLOAD
      + push("00")
      + OPCODE_MSTORE
      + rReturn("00", "20")
    }else if(instructions[0].value == "8") // transfer
    {
      returnValue = jumpLocation
      + push("24") // Put amount param on the stack 2 times (one for - and one for +)
      + OPCODE_CALLDATALOAD
      + OPCODE_DUP1
      + OPCODE_CALLER // Get my address
      + push("01000000000000000000000000")
      + OPCODE_MUL
      + push("00")
      + OPCODE_MSTORE
      + keccak256("00", "14") // Get my balance key
      + OPCODE_SLOAD // Get my balance
      + OPCODE_SUB
      + OPCODE_CALLER // TODO: Use duplicate
      + push("01000000000000000000000000")
      + OPCODE_MUL
      + push("00")
      + OPCODE_MSTORE
      + keccak256("00", "14") // Get my balance key
      + OPCODE_SSTORE // Store my new balance


      + push("04") // Put address on memory
      + OPCODE_CALLDATALOAD
      + push("01000000000000000000000000")
      + OPCODE_MUL
      + push("00")
      + OPCODE_MSTORE
      + keccak256("00", "14") // Get key position
      + OPCODE_DUP1
      + OPCODE_SLOAD // Get my balance
      + OPCODE_ADD
      + OPCODE_SSTORE
      + push("01") // Return true
      + push("00")
      + OPCODE_MSTORE
      + rReturn("00", "20")
    }else
    {
      returnValue = jumpLocation
      + push(hexReturnValue)
      + push("00")
      + OPCODE_MSTORE
      + rReturn("00", "20")
    }

    return returnValue
  }