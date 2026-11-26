import React from 'react';
import { useWalletConnect, useAccount } from '@dogeos/dogeos-sdk';

export default function App() {
  const { isConnected, isConnecting, openModal, disconnect } = useWalletConnect();
  const { address } = useAccount();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#05050a] text-white">
      <h1 className="text-3xl font-extrabold text-amber-400 tracking-wider">
        DOGELAMBO
      </h1>
      <p className="text-sm text-slate-400 mt-1 mb-6">
        Koneksi Dompet DogeOS Chikyū Testnet (Chain ID: 6281971)
      </p>

      {isConnected && address ? (
        <div className="p-4 rounded-2xl bg-white/5 border border-amber-400/30">
          <p className="text-xs text-emerald-400 font-bold mb-1">DOMPET TERHUBUNG</p>
          <p className="font-mono text-sm text-amber-300 mb-4">{address}</p>
          <button
            onClick={disconnect}
            className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold"
          >
            Putuskan Koneksi
          </button>
        </div>
      ) : (
        <button
          onClick={openModal}
          disabled={isConnecting}
          className="px-6 py-3 rounded-xl bg-amber-400 text-black font-bold text-sm shadow-lg"
        >
          {isConnecting ? 'Menghubungkan...' : 'Connect MyDoge Wallet'}
        </button>
      )}
    </div>
  );
}
