var labelMap = new Map()

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
  
  function functionLogic(jumpLocation, functionData)
  {
    let functionName = functionData.name
    let parameters = functionData.parameters
    let instructions = functionData.instructions

    let literalValue = intToHex(parseInt(instructions[0].value))
    let literalInstructionLength = intToHex(literalValue.length/2)

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

  function functionIntLogic(jumpLocation, functionData)
  {
    let functionName = functionData.name
    let parameters = functionData.parameters
    let instructions = functionData.instructions

    labelMap = new Map()
    for(i=0; i<parameters.length; i++)
    {
      let paramSize = 0
      if(parameters[i].type == "address")
      {
        paramSize = 20
      }else if(parameters[i].type == "string")
      {
        paramSize = 32 // TODO check this
      }else if(parameters[i].type == "bool")
      {
        paramSize = 32
      }else if(parameters[i].type == "uint256")
      {
        paramSize = 32
      }

      if(paramSize == 0) {
        console.log("Error: invalid param at EVM generation")
      }
      labelMap.set(parameters[i].label, {calldataLocation: intToHex(4 + i*32), size: paramSize})
    }

    hexReturnValue = intToHex(parseInt(instructions[0].value))
    if(functionName == "transfer" || functionName == "balanceOf") // transfer
    {
      returnValue = jumpLocation
      for(let i=0; i<instructions.length; i++)
      {
        if(instructions[i].name == "operation")
        {
          returnValue += operation(instructions[i].lValue, instructions[i].rlValue, instructions[i].operator, instructions[i].rrValue)
        }else if(instructions[i].name == "returnUint")
        {
          returnValue += returnLiteral(intToHex(instructions[i].value), "20")
        }else if(instructions[i].name == "returnLabel")
        {
          returnValue += returnLabel(instructions[i].value, intToHex(32))
        }
      }
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