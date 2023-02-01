import React from 'react';
import './App.css';
import { AuthProvider, ChainNetwork, JSONObject, OreId, PopupPluginSignParams } from "oreid-js";
import { WebPopup } from "oreid-webpopup";
import { OreidProvider } from "oreid-react";
import { ethers } from 'ethers';
import { takeCoverage } from 'v8';


let oreId : OreId 
const appId = process.env.REACT_APP_OREID_APP_ID || ''


/***
 *    .____                         .__          
 *    |    |       ____      ____   |__|   ____  
 *    |    |      /  _ \    / ___\  |  |  /    \ 
 *    |    |___  (  <_> )  / /_/  > |  | |   |  \
 *    |_______ \  \____/   \___  /  |__| |___|  /
 *            \/          /_____/             \/ 
 */
const login = async (loginMethod: AuthProvider) => {
  const isUsingProxyServer : boolean = (process.env.REACT_APP_ISUSINGPROXYSERVER as unknown) as boolean 
  console.log(`isUsingProxyServer: ${isUsingProxyServer}`)
  const url = process.env.REACT_APP_OREID_PROTOCOL + '://' + process.env.REACT_APP_OREID_HOST
  const oreIdUrl = url || ''
  console.log(`Constructing the OreId object with oreIdUrl: ${oreIdUrl}. Then calling oreId.popup.auth() to being the login process`)

  oreId = new OreId({ 
    isUsingProxyServer, 
    appId,
    plugins:{popup: WebPopup()},
    oreIdUrl
  });
  await oreId.init()

  oreId.popup.auth({ provider: loginMethod}).then(async (response) => {
    console.log(response)
  }).catch((error) => {
    console.error(error)
  })
}

/***
 *      _________ .__                                ___________                  
 *     /   _____/ |__|    ____     ____              \__    ___/ ___  ___   ____  
 *     \_____  \  |  |   / ___\   /    \     ______    |    |    \  \/  /  /    \ 
 *     /        \ |  |  / /_/  > |   |  \   /_____/    |    |     >    <  |   |  \
 *    /_______  / |__|  \___  /  |___|  /              |____|    /__/\_ \ |___|  /
 *            \/       /_____/        \/                               \/      \/ 
 */
const runTxn = async () => {
  if(!oreId) {
    console.error('The instance of oreId does not seem to be initialized yet. Please login first.')
    return
  }

  const userChainAccounts = oreId.auth.user.data.chainAccounts;
  const ethAccount = userChainAccounts.find(ca => ca.chainNetwork === 'eth_goerli')

  const transactionBody = {
    from: ethAccount?.chainAccount!,
    to: "0x60d5DA4FC785Dd1dA9c2dAF084B2D5ba478c8f8b",
    value: "0x02",
    gasPrice: "0x1A4A6",
    gasLimit: "0x6274"
  }

  try {
    const transaction = await oreId.createTransaction({
      transaction: transactionBody,
      //signedTransaction: XXXX,
      chainAccount: ethAccount?.chainAccount,
      chainNetwork: ethAccount?.chainNetwork!,
      signOptions: {
        broadcast: false
      }
    })
    console.log(`About to sign the following transaciton object:`, transaction)
    const webWidgetSignResult = await oreId.popup.sign({ transaction })
    console.log('The signed transaction object returned from oreid:', webWidgetSignResult)
    
  } catch (error) {
    console.error(error)
  }

}


const runCustomTxn = async () => {
  if(!oreId) {
    console.error('The instance of oreId does not seem to be initialized yet. Please login first.')
    return
  }

  const userChainAccounts = oreId.auth.user.data.chainAccounts;
  const ethAccount = userChainAccounts.find(ca => ca.chainNetwork === 'eth_goerli')

  try {
    const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY 
    var url = 'https://eth-goerli.g.alchemy.com/v2/'+alchemyApiKey;
    var customHttpProvider = new ethers.providers.JsonRpcProvider(url);
    let result = await customHttpProvider.getBlockNumber()

    const abi = [
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "initMessage",
            "type": "string"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "string",
            "name": "oldStr",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "newStr",
            "type": "string"
          }
        ],
        "name": "UpdatedMessages",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "message",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "newMessage",
            "type": "string"
          }
        ],
        "name": "update",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    const address = "0x29adCb924F9B90fA0f2c22D94cA3C84AfeC6C0d4";

    const erc20 = new ethers.Contract(address, abi, customHttpProvider);
    // Can call read only functions as follows
    // let d = await erc20.message();
    // console.log(d_

    let tx = await erc20.populateTransaction.update("this is the new message");
    console.log(tx)

    const txnObj = {
      serializedTransaction: tx.data,
      to: tx.to
    }

    console.log(result)

    const transaction = await oreId.createTransaction({
      signedTransaction: txnObj as JSONObject,
      chainAccount: ethAccount?.chainAccount,
      chainNetwork: ethAccount?.chainNetwork!,
      signOptions: {
        broadcast: false
      }
    })

    console.log(`About to sign the following transaciton object:`, transaction)
    const webWidgetSignResult = await oreId.popup.sign({ transaction })
    console.log('The signed transaction object returned from oreid:', webWidgetSignResult)
    
  } catch (error) {

    console.error(error)

  }

}

/***
 *     ____ ___  ____  ___
 *    |    |   \ \   \/  /
 *    |    |   /  \     / 
 *    |    |  /   /     \ 
 *    |______/   /___/\  \
 *                     \_/
 */

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => login(AuthProvider.Email)}>Login (email)</button>
        <button onClick={() => login(AuthProvider.Google)}>Login (Google)</button>
        <div> 
          --------
        </div>
        <button onClick={runTxn}>Run Basic Transfer Transaction</button>
        <button onClick={runCustomTxn}>Run Custom Smart Contract Transaction</button>
      </header>
    </div>
  );
}

export default App;
