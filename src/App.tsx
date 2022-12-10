import React from 'react';
import './App.css';
import { AuthProvider, ChainNetwork, OreId } from "oreid-js";
import { WebPopup } from "oreid-webpopup";
import { OreidProvider } from "oreid-react";



let oreId : OreId 

const appId = process.env.REACT_APP_OREID_APP_ID || ''
const login = async () => {
  console.log('login button clicked')

  const oreIdUrl = 'https://'+process.env.REACT_APP_OREID_URL || ''

  oreId = new OreId({ 
    isUsingProxyServer: true, 
    appId,
    plugins:{popup: WebPopup()},
    oreIdUrl,
  });
  await oreId.init()

  oreId.popup.auth({ provider: 'google' as AuthProvider}).then(async (response) => {
    console.log(response)
  }).catch((error) => {
    console.log(error)
  })
}

const runTxn = async () => {
  if(!oreId) {
    console.log('login first')
    return
  }

  const userChainAccounts = oreId.auth.user.data.chainAccounts;
  const ethAccount = userChainAccounts.find(ca => ca.chainNetwork === 'eth_goerli')

  const transactionBody = {
    from: ethAccount?.chainAccount!,
    to: "0x60d5DA4FC785Dd1dA9c2dAF084B2D5ba478c8f8b",
    value: "0x01"
  }

  try {
    const transaction = await oreId.createTransaction({
      transaction: transactionBody,
      chainAccount: ethAccount?.chainAccount,
      chainNetwork: ethAccount?.chainNetwork!,
    })
    console.log(transaction)
    const { transactionId } = await oreId.popup.sign({ transaction })
    console.log(transactionId)
  } catch (error) {
    console.log(error)
  }

}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={login}>Login</button>
        <button onClick={runTxn}>Run Transaction</button>
      </header>
    </div>
  );
}

export default App;
