import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { WalletConnectProvider, ChainTypeEnum } from '@dogeos/dogeos-sdk'
import '@dogeos/dogeos-sdk/style.css'

const dogeOSChikyuTestnet = {
  id: 6281971,
  name: 'DogeOS Chikyū Testnet',
  nativeCurrency: { name: 'DOGE', symbol: 'DOGE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dogeos.org'] },
  },
  blockExplorers: {
    default: {
      name: 'DogeOS Explorer',
      url: 'https://dogeos.org',
    },
  },
  testnet: true,
}

const dogeConfig = {
  clientId: import.meta.env.VITE_DOGEOS_CLIENT_ID,
  defaultConnectChain: ChainTypeEnum.EVM,
  chains: {
    evm: [dogeOSChikyuTestnet],
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletConnectProvider config={dogeConfig}>
      <App />
    </WalletConnectProvider>
  </React.StrictMode>,
)
