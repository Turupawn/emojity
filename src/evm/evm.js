var accounts
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
        reject("must install MetaMask1")
        document.getElementById("web3_message").textContent="Error: Porfavor conéctate a Metamask";
        const web3 = new Web3()
        resolve(web3)
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask2")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
          const web3 = new Web3()
          resolve(web3)
        }
      });
    }
  });
};
async function loadWeb3() {
  web3 = await getWeb3()

  if(!web3)
  {
    console.log(web3)
    return;
  }

  web3.eth.getAccounts(function(err, _accounts){
    accounts = _accounts
    if (err != null)
    {
      console.error("An error occurred: "+err)
    } else if (accounts.length > 0)
    {
      onWalletConnectedCallback()
      document.getElementById("account_address").style.display = "block"
    } else
    {
      document.getElementById("connect_button").style.display = "block"
    }
  });
}
loadWeb3()

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" })
  accounts = await web3.eth.getAccounts()
  onWalletConnectedCallback()
}

const onWalletConnectedCallback = async () => {
}

function getSelector(functionName) {
  //let hash = (web3.utils.soliditySha3(web3.utils.toHex(functionName))).substring(2)
  return keccak256(functionName)
}
  
function contractHeader(contractSize) {
  offetPlaceholder = "QQ"//intToHex((deltaWithoutContractSizeAdjutment + (contractSize.length*3)/2))
  while(contractSize.length > offetPlaceholder.length)
  {
    offetPlaceholder = "QQ" + offetPlaceholder
  }

  irCode = []
  convertInstructionToBytecode(constructorInstructions)

  let constructorBytecode = irCodeToBytecode()

  irCode = []
  addBytecode(constructorBytecode)
  codeCopy("00", offetPlaceholder, contractSize)
  rReturn("00", contractSize)
  addOpcode("INVALID")

  let irSize = 0
  for(let i=0; i<irCode.length; i++)
  {
    irSize += irCode[i].byteSize
  }
  irSize = intToHex(irSize)
  while(irSize.length < offetPlaceholder.length)
  {
    irSize = "00" + irSize
  }

  for(let i=0; i<irCode.length; i++)
  {
    if(irCode[i].value && irCode[i].value[0]=="Q")
    {
      irCode[i].value = irSize
    }
  }

  let headerBytecode = irCodeToBytecode()

  return headerBytecode
}

function intToHex(num) {

  returnValue = (num).toString(16).toUpperCase()

  if(returnValue.length%2 != 0)
  {
    returnValue = "0" + returnValue
  }
  return returnValue.toUpperCase()
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

function selectorLookupIr(signature, destination) {
  addPush(getSelector(signature).substring(0, 8).toUpperCase())
  addOpcode("DUP2")
  addOpcode("EQ")
  addPushJump(destination)
  addOpcode("JUMPI")
}

function functionLogic(jumpLocation, functionData)
{
  let functionName = functionData.name
  let parameters = functionData.parameters
  let instructions = functionData.instructions
  initMemory()

  resetLocalVariables()
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
      paramSize = 32 //  TODO: should this be 1?
    }else if(parameters[i].type == "uint256")
    {
      paramSize = 32
    }

    if(paramSize == 0) {
      console.log("Error: invalid param at EVM generation")
    }
    setLocalVariables(parameters[i].label, {position: intToHex(4 + i*32), size: paramSize, location: "calldata"})
  }

  addJumpDestination(jumpLocation)

  convertInstructionToBytecode(instructions)
}

function utilityPushValue(value, applyPadding) {
  if(value.type == "literal")
  {
    // TODO: should we change the value variable name?
    let hexValue = intToHex(BigInt(value.value))
    if(applyPadding) {
      hexValue = hexValue.padEnd(64, '0')
    }
    addPush(hexValue)
  } else if(value.type == "variable") {
    putValueOnStack(value.value, false/* wtf is this */)
  } else {
    console.log("Error: invalid selector type")
  }
}

function convertInstructionToBytecode(instructionsParam) {
  for(let i=0; i<instructionsParam.length; i++)
  {
    if(instructionsParam[i].name == "operation")
    {
      operation(instructionsParam[i].lValue, instructionsParam[i].rlValue, instructionsParam[i].operator, instructionsParam[i].rrValue)
    } else if(instructionsParam[i].name == "return")
    {
      if(typeof instructionsParam[i].value != 'bigint') {
        returnLabel(instructionsParam[i].value, 32)
      } else {
        if(instructionsParam[i].returnType == "string")
        {
          returnStringLiteral(instructionsParam[i].value)
        } else{
          returnLiteral(intToHex(BigInt(instructionsParam[i].value)), 32)
        }
      }
    } else if(instructionsParam[i].name == "assignment")
    {
      assignment(instructionsParam[i].lValue, instructionsParam[i].rValue)
    } else if(instructionsParam[i].name == "literalAssignment")
    {
      literalAssignment(instructionsParam[i].lValue, intToHex(BigInt(instructionsParam[i].rValue)))
    } else if(instructionsParam[i].name == "logEvent")
    {
      logEvent(instructionsParam[i].topics)
    } else if(instructionsParam[i].name == "ifStatement")
    {
      ifStatement(instructionsParam[i].condition, instructionsParam[i].instructions)
    } else if(instructionsParam[i].name == "whileLoop")
    {
      whileLoop(instructionsParam[i].condition, instructionsParam[i].instructions)
    } else if(instructionsParam[i].name == "declareUint"
        || instructionsParam[i].name == "declareAddress" // TODO: Should we differentiate types?
        || instructionsParam[i].name == "declareString"
        || instructionsParam[i].name == "declareBool"
    )
    {
      memoryVariablePosition = allocateMemory(32)
      setLocalVariables(instructionsParam[i].label[0], {position: intToHex(memoryVariablePosition), size: 32, location: "memory", type: instructionsParam[i].type})
    } else if(instructionsParam[i].name == "externalCall")
    {
      utilityPushValue(instructionsParam[i].selector, true)
      if(instructionsParam[i].selector.type == "variable"){
        addPush("0100000000000000000000000000000000000000000000000000000000");
        addOpcode('MUL');
      }
      let selectorMemoryLocation = allocateMemory(4)
      addPush(intToHex(selectorMemoryLocation))
      addOpcode("MSTORE")

      for(let j=0; j<instructionsParam[i].params.length; j++)
      {
        if(instructionsParam[i].params[j].type == "literal")
        {
          let paramHex = intToHex(BigInt(instructionsParam[i].params[j].value))
          paramHex = paramHex.padStart(64, '0')
          addPush(paramHex)
        }else if(instructionsParam[i].params[j].type == "variable")
        {
          putValueOnStack(instructionsParam[i].params[j].value, false/* wtf is this */)
        }
        let paramMemoryLocation = allocateMemory(32)
        addPush(intToHex(paramMemoryLocation))
        addOpcode("MSTORE")
      }

      let returnValuePosition
      if(instructionsParam[i].returnValueStorage)
      {
        returnValuePosition = allocateMemory(32)
        addPush("20")//ret size
        addPush(intToHex(returnValuePosition))//ret offset
      } else
      {
        addPush("00")//ret size
        addPush("00")//ret offset
      }

      addPush(intToHex(4+32*instructionsParam[i].params.length))//args size
      addPush(intToHex(selectorMemoryLocation))//args offset
      utilityPushValue(instructionsParam[i].value, false)
      utilityPushValue(instructionsParam[i].contractAddress, false)
      utilityPushValue(instructionsParam[i].gas, false)
      addOpcode("CALL")

      // Revert if subcontext reverted
      addPush("00")
      addOpcode("EQ")
      addPushJump(revertDestination)
      addOpcode("JUMPI")

      if(instructionsParam[i].returnValueStorage)
      {
        addPush(intToHex(returnValuePosition))
        addOpcode("MLOAD")
        // TODO: does this accept memory variables?
        putValueOnState(instructionsParam[i].returnValueStorage, false/* wtf is this */)
      }
    } else if(instructionsParam[i].name == "revert")
    {
      addPushJump(revertDestination)
      addOpcode("JUMPI")
    }
  }
}