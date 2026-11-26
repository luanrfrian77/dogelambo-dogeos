import React from 'react';
import { useWalletConnect, useAccount } from '@dogeos/dogeos-sdk';

export default function App() {
  const { isConnected, openModal, disconnect } = useWalletConnect();
  const { address } = useAccount();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-amber-400">DOGELAMBO</h1>
      <p className="text-sm text-slate-400 mt-1">DogeOS Chikyū Testnet Ready</p>
      <button
        onClick={isConnected ? disconnect : openModal}
        className="mt-5 px-5 py-2.5 bg-amber-400 text-black font-bold rounded-xl"
      >
        {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect MyDoge'}
      </button>
    </div>
  );
}
