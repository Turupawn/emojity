const NETWORK_ID = 5

const MY_CONTRACT_ADDRESS = "0x47cd7ad1741c93FBb44c3bb88158f8bC60B3CA5D"
const MY_CONTRACT_ABI_PATH = "./json_abi/MyContract.json"
var my_contract

var accounts
var web3

function metamaskReloadCallback() {
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se cambió el account, refrescando...";
    window.location.reload()
  })
  window.ethereum.on('networkChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se el network, refrescando...";
    window.location.reload()
  })
}

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

const getContract = async (web3, address, abi_path) => {
  const response = await fetch(abi_path);
  const data = await response.json();
  
  const netId = await web3.eth.net.getId();
  contract = new web3.eth.Contract(
    data,
    address
    );
  return contract
}

async function loadDapp() {
  loadEmojiLib()

  metamaskReloadCallback()
  document.getElementById("web3_message").textContent="Please connect to Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          my_contract = await getContract(web3, MY_CONTRACT_ADDRESS, MY_CONTRACT_ABI_PATH)
          document.getElementById("web3_message").textContent="You are connected to Metamask"
          onContractInitCallback()
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
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Please connect to Goerli";
      }
    });
  };
  awaitWeb3();
}

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" })
  accounts = await web3.eth.getAccounts()
  onWalletConnectedCallback()
}

loadDapp()

const onContractInitCallback = async () => {
  var hello = await my_contract.methods.hello().call()
  var count = await my_contract.methods.count().call()
  var last_writer = await my_contract.methods.count().call()

  var contract_state = "Hello: " + hello
    + ", Count: " + count
    + ", Last Writer: " + last_writer
  
  document.getElementById("contract_state").textContent = contract_state;
}

const onWalletConnectedCallback = async () => {
}


//// Functions ////

const setHello = async (_hello) => {
  const result = await my_contract.methods.setHello(_hello)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Executing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

// EVM compile

const compile = async (emojis, unicodeCodePoints) => {

  var functions = []
  for(i=0; i<emojis.length; i++)
  {
    functionName = getEmojiDescription(emojis[i], emojiMap)
    functionName = functionName.charAt(0).toLowerCase() + functionName.slice(1);
    i+=1
    returnValue = "0B"

    switch (unicodeCodePoints[i]) {
      case '30-20e3':
        returnValue = "00"
        break;
      case '31-20e3':
        returnValue = "01"
        break;
      case '32-20e3':
        returnValue = "02"
        break;
      case '33-20e3':
        returnValue = "03"
        break;
      case '34-20e3':
        returnValue = "04"
        break;
      case '35-20e3':
        returnValue = "05"
        break;
      case '36-20e3':
        returnValue = "06"
        break;
      case '37-20e3':
        returnValue = "07"
        break;
      case '38-20e3':
        returnValue = "08"
        break;
      case '39-20e3':
        returnValue = "09"
        break;
      case '40-20e3':
        returnValue = "0A"
        break;
    }
    functions.push({name: functionName, returnValue: returnValue})
  }

  selectorLookups = ""
  for(i=0; i<functions.length; i++)
  {
    selectorLookups += selectorLookup(functions[i].name+"()", "j"+ String.fromCharCode(i))
  }

  console.log(selectorLookups)

  functionLogics = ""
  for(i=0; i<functions.length; i++)
  {
    functionLogics += functionLogic("d"+ String.fromCharCode(i), functions[i].returnValue)
  }

  console.log(functions.length)
  console.log(getSelector(functions[0].name+"()"))
  console.log(getSelector(functions[1].name+"()"))

  contractBody = ""
  + push("j1")
  + push("j0")
  + OPCODE_JUMP
  + "d1"
  + selectorLookups
  + push("00")
  + OPCODE_DUP1
  + OPCODE_REVERT
  + functionLogics
  + "d0"
  + push("00")
  + push("0100000000000000000000000000000000000000000000000000000000")
  + push("00")
  + OPCODE_CALLDATALOAD
  + OPCODE_DIV
  + OPCODE_SWAP1
  + OPCODE_POP
  + OPCODE_SWAP1
  + OPCODE_JUMP
  
  //contractBody = begin + push(functionSelector) + end
  contractBodySize = intToHex(contractBody.length)

  // Setup Jump Destinations
  for(var i=0; i<contractBody.length; i+=2)
  {
    if(contractBody[i]=='j')
    {
      for(var j=0; j<contractBody.length; j+=2)
      {
        if(contractBody[j]=='d' && contractBody[j+1]==contractBody[i+1])
        {
          destinationPosition = intToHex(j)
          contractBody = modifyChar(contractBody, i, destinationPosition[0])
          contractBody = modifyChar(contractBody, i+1, destinationPosition[1])
        }
      }
    }
  }

  // Setup OPCODE_JUMPDEST
  for(var i=0; i<contractBody.length; i+=2)
  {
    if(contractBody[i]=='d')
    {
      contractBody = modifyChar(contractBody, i, '5')
      contractBody = modifyChar(contractBody, i+1, 'B')
    }
  }

  var abi = '['

  for(i=0; i<functions.length; i++)
  {
    if(i!=0)
    {
      abi += ','
    }
    abi += '{"inputs": [],"name": "'
    abi += functions[i].name
    abi += '","outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}'
  }
  abi += "]"

  document.getElementById("_bytecode").value = contractHeader(contractBodySize) + contractBody
  document.getElementById("_abi").value = abi
}