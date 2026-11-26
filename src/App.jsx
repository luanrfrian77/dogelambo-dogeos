
import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useWalletConnect, useAccount } from '@dogeos/dogeos-sdk';

const CONTRACT_ADDRESS = "0x4e54B2A854743AE87000E815eAdF5132d8bB4825";
const CONTRACT_ABI = [
  "function placeBatchBets(uint256[] calldata carIndices, uint256[] calldata amounts) external payable",
  "function placeBet(uint256 carIndex) external payable",
  "event RaceFinished(uint256 indexed roundId, uint256 winningCar, uint256 multiplier, address indexed player, uint256 payout)"
];

const ROUND_DURATION_SECONDS = 120;
const CHIPS = [0.1, 0.5, 1, 5, 10];

const CARS = [
  {
    id: 0,
    brand: "DAIHATSU",
    model: "Copen GR Sport",
    multiplier: 5,
    prob: 14.17,
    tierColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 1,
    brand: "TOYOTA",
    model: "GR Supra MK5",
    multiplier: 5,
    prob: 14.17,
    tierColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 2,
    brand: "HONDA",
    model: "Civic Type R",
    multiplier: 5,
    prob: 14.17,
    tierColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 3,
    brand: "MAZDA",
    model: "RX-7 Spirit R",
    multiplier: 5,
    prob: 14.17,
    tierColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 4,
    brand: "SUZUKI",
    model: "Swift Sport",
    multiplier: 5,
    prob: 14.16,
    tierColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 5,
    brand: "NISSAN",
    model: "GT-R Nismo",
    multiplier: 5,
    prob: 14.16,
    tierColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 6,
    brand: "BMW",
    model: "M4 Competition",
    multiplier: 10,
    prob: 12.0,
    tierColor: "from-cyan-400 to-blue-500",
    badgeBg: "bg-cyan-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 7,
    brand: "PORSCHE",
    model: "911 GT3 RS",
    multiplier: 25,
    prob: 2.5,
    tierColor: "from-purple-500 to-pink-500",
    badgeBg: "bg-purple-400 text-black",
    img: "https://unsplash.com"
  },
  {
    id: 8,
    brand: "ROLLS ROYCE",
    model: "Wraith Black Badge",
    multiplier: 40,
    prob: 0.5,
    tierColor: "from-amber-400 to-orange-500",
    badgeBg: "bg-amber-400 text-black",
    img: "https://unsplash.com"
  }
];

const MUSIC_TRACKS = [
  {
    name: "Tokyo Drift Synth",
    tempo: 240,
    bassNotes: [55.0, 55.0, 65.41, 73.42, 55.0, 82.41, 73.42, 65.41],
    leadNotes: [220, 0, 261.63, 293.66, 329.63, 293.66, 261.63, 196.0]
  },
  {
    name: "Chikyū Neon Night",
    tempo: 280,
    bassNotes: [65.41, 65.41, 77.78, 87.31, 65.41, 98.0, 87.31, 77.78],
    leadNotes: [261.63, 311.13, 349.23, 392.0, 349.23, 311.13, 261.63, 233.08]
  }
];

export default function App() {
  const { isConnected, isConnecting, openModal, disconnect } = useWalletConnect();
  const { address } = useAccount();

  // Mode: 'SIMULATION' | 'REAL'
  const [gameMode, setGameMode] = useState('SIMULATION');
  const [simBalance, setSimBalance] = useState(100.0);
  const [realBalance, setRealBalance] = useState('0.00');

  // Betting States
  const [selectedChip, setSelectedChip] = useState(0.5);
  const [pendingBets, setPendingBets] = useState({});
  const [committedBets, setCommittedBets] = useState({});
  const [lastRoundBets, setLastRoundBets] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txFeedback, setTxFeedback] = useState({ type: '', message: '', hash: '' });

  // Round & Animation States
  const [roundNumber, setRoundNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_SECONDS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(null);
  const [winnerModal, setWinnerModal] = useState(null);
  const [historyCars, setHistoryCars] = useState([1, 6, 3, 0, 7, 2]);

  // Audio States
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef(null);
  const musicIntervalRef = useRef(null);
  const committedBetsRef = useRef(committedBets);
  const gameModeRef = useRef(gameMode);
  const roundRef = useRef(roundNumber);

  useEffect(() => {
    committedBetsRef.current = committedBets;
  }, [committedBets]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    roundRef.current = roundNumber;
  }, [roundNumber]);

  // Inject custom keyframe animations & glass-panel styling safely without touching index.html
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .font-orbitron { font-family: 'Orbitron', sans-serif; }
      .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
      .glass-panel {
        background: rgba(14, 16, 28, 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65);
      }
      @keyframes speedLinesAnim {
        0% { background-position: 0 0; }
        100% { background-position: 180px 0; }
      }
      .speed-lines {
        background-image: repeating-linear-gradient(
          90deg,
          rgba(0, 243, 255, 0.06) 0px,
          rgba(0, 243, 255, 0.06) 2px,
          transparent 2px,
          transparent 16px
        );
        animation: speedLinesAnim 0.3s linear infinite;
      }
      @keyframes zoomCarSlide {
        0% { transform: translateX(-110%) scale(0.75) skewX(-10deg); opacity: 0; }
        75% { transform: translateX(4%) scale(1.03) skewX(2deg); opacity: 1; }
        100% { transform: translateX(0) scale(1) skewX(0deg); opacity: 1; }
      }
      .animate-car-entry {
        animation: zoomCarSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  // Fetch Real DOGE Balance on DogeOS Chikyū Testnet
  const fetchRealBalance = async () => {
    if (!isConnected || !address || !window.ethereum) {
      setRealBalance('0.00');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      const formatted = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
      setRealBalance(formatted);
    } catch (err) {
      console.error("Gagal memuat saldo DOGE:", err);
    }
  };

  useEffect(() => {
    fetchRealBalance();
  }, [isConnected, address, roundNumber]);

  // Switch network helper for Mode Nyata
  const ensureDogeOSNetwork = async () => {
    if (!window.ethereum) throw new Error("Dompet Web3 / MyDoge tidak terdeteksi.");
    const targetChainHex = "0x5fdaf3"; // 6281971
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetChainHex,
              chainName: "DogeOS Chikyū Testnet",
              nativeCurrency: { name: "DOGE", symbol: "DOGE", decimals: 18 },
              rpcUrls: ["https://rpc.chikyutestnet.dogeos.org"],
              blockExplorerUrls: ["https://explorer.chikyutestnet.dogeos.org"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  };

  // =========================================================================
  // WEB AUDIO API: SUARA MESIN MOBIL & MUSIK SYNTHWAVE / DRIFT
  // =========================================================================
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Suara Deru Mesin Mobil (Engine Rev) saat klik mobil / chip
  const playEngineRev = (intensity = 1) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      const baseFreq = 65 + intensity * 18;
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2.4, now + 0.14);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.28);

      osc2.frequency.setValueAtTime(baseFreq * 0.5, now);
Use code with caution.
osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.14);
filter.type = 'lowpass';
filter.frequency.setValueAtTime(650, now);
filter.frequency.exponentialRampToValueAtTime(1600, now + 0.14);
gain.gain.setValueAtTime(0.14, now);
gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
osc1.connect(filter);
osc2.connect(filter);
filter.connect(gain);
gain.connect(ctx.destination);
osc1.start(now);
osc2.start(now);
osc1.stop(now + 0.3);
osc2.stop(now + 0.3);
} catch (e) {}
};
// Suara Tick Neon Spotlight saat animasi akhir ronde
const playSpotlightTick = (step) => {
if (isMuted) return;
try {
const ctx = getAudioContext();
const now = ctx.currentTime;
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(320 + step * 25, now);
gain.gain.setValueAtTime(0.08, now);
gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start(now);
osc.stop(now + 0.08);
} catch (e) {}
};
// Suara Turbo Whoosh & Victory Chime saat mobil pemenang keluar
const playWinnerTurboSound = (isWin) => {
if (isMuted) return;
try {
const ctx = getAudioContext();
const now = ctx.currentTime;
// Turbo engine pass-by
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'sawtooth';
osc.frequency.setValueAtTime(90, now);
osc.frequency.exponentialRampToValueAtTime(420, now + 0.45);
osc.frequency.exponentialRampToValueAtTime(120, now + 0.9);
gain.gain.setValueAtTime(0.16, now);
gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start(now);
osc.stop(now + 0.95);
// Chime arpeggio jika menang
if (isWin) {
const notes = [523.25, 659.25, 783.99, 1046.5];
notes.forEach((freq, idx) => {
const chime = ctx.createOscillator();
const cGain = ctx.createGain();
chime.type = 'triangle';
chime.frequency.setValueAtTime(freq, now + 0.2 + idx * 0.1);
cGain.gain.setValueAtTime(0.14, now + 0.2 + idx * 0.1);
cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55 + idx * 0.1);
chime.connect(cGain);
cGain.connect(ctx.destination);
chime.start(now + 0.2 + idx * 0.1);
chime.stop(now + 0.55 + idx * 0.1);
});
}
} catch (e) {}
};
// Sequencer Musik Latar Synthwave / Drift
useEffect(() => {
if (musicIntervalRef.current) {
clearInterval(musicIntervalRef.current);
musicIntervalRef.current = null;
}
if (!isMusicPlaying) return;
const track = MUSIC_TRACKS[trackIndex];
let step = 0;
musicIntervalRef.current = setInterval(() => {
if (isMuted) return;
try {
const ctx = getAudioContext();
const now = ctx.currentTime;
// Synth Bassline
const bassFreq = track.bassNotes[step % track.bassNotes.length];
if (bassFreq > 0) {
const bassOsc = ctx.createOscillator();
const bassGain = ctx.createGain();
bassOsc.type = 'sawtooth';
bassOsc.frequency.setValueAtTime(bassFreq, now);
bassGain.gain.setValueAtTime(0.06, now);
bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
bassOsc.connect(bassGain);
bassGain.connect(ctx.destination);
bassOsc.start(now);
bassOsc.stop(now + 0.2);
}
// Synth Lead Melody
const leadFreq = track.leadNotes[step % track.leadNotes.length];
if (leadFreq > 0) {
const leadOsc = ctx.createOscillator();
const leadGain = ctx.createGain();
leadOsc.type = 'square';
leadOsc.frequency.setValueAtTime(leadFreq, now);
leadGain.gain.setValueAtTime(0.025, now);
leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
leadOsc.connect(leadGain);
leadGain.connect(ctx.destination);
leadOsc.start(now);
leadOsc.stop(now + 0.18);
}
step++;
} catch (e) {}
}, track.tempo);
return () => {
if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
};
}, [isMusicPlaying, trackIndex, isMuted]);
// =========================================================================
// SIKLUS 120 DETIK & ANIMASI KELUAR MOBIL PEMENANG
// =========================================================================
useEffect(() => {
const timer = setInterval(() => {
if (isSpinning) return;
setTimeLeft((prev) => {
if (prev <= 1) {
runEndOfRoundAnimation();
return ROUND_DURATION_SECONDS;
}
return prev - 1;
});
}, 1000);
return () => clearInterval(timer);
}, [isSpinning]);
const pickWeightedWinningCar = () => {
const rand = Math.random() * 100;
let cumulative = 0;
for (let i = 0; i < CARS.length; i++) {
cumulative += CARS[i].prob;
if (rand <= cumulative) return i;
}
return 0;
};
const runEndOfRoundAnimation = () => {
setIsSpinning(true);
const winningIdx = pickWeightedWinningCar();
const totalSteps = 18;
let currentStep = 0;
const spinInterval = setInterval(() => {
const randomSpot = Math.floor(Math.random() * CARS.length);
setSpotlightIndex(randomSpot);
playSpotlightTick(currentStep);
currentStep++;
if (currentStep >= totalSteps) {
clearInterval(spinInterval);
setSpotlightIndex(winningIdx);
const winnerCar = CARS[winningIdx];
const currentCommitted = committedBetsRef.current;
const betOnWinner = currentCommitted[winningIdx] || 0;
const payout = +(betOnWinner * winnerCar.multiplier).toFixed(4);
const isWin = payout > 0;
if (isWin && gameModeRef.current === 'SIMULATION') {
setSimBalance((prev) => +(prev + payout).toFixed(4));
}
playWinnerTurboSound(isWin);
setHistoryCars((prev) => [winningIdx, ...prev.slice(0, 7)]);
setWinnerModal({
round: roundRef.current,
car: winnerCar,
betAmount: betOnWinner,
payout,
isWin
});
setTimeout(() => {
setWinnerModal(null);
setSpotlightIndex(null);
setCommittedBets({});
setRoundNumber((r) => r + 1);
setTimeLeft(ROUND_DURATION_SECONDS);
setIsSpinning(false);
if (gameModeRef.current === 'REAL') {
fetchRealBalance();
}
}, 4800);
}
}, 175);
};
// =========================================================================
// LOGIKA TARUHAN & 1x TRANSAKSI BATCH ON-CHAIN
// =========================================================================
const handleSelectCar = (carId) => {
if (isSpinning) return;
playEngineRev(1.2);
setPendingBets((prev) => ({
...prev,
[carId]: +((prev[carId] || 0) + selectedChip).toFixed(4)
}));
};
const handleRepeatBets = () => {
if (isSpinning || Object.keys(lastRoundBets).length === 0) return;
playEngineRev(1.5);
setPendingBets({ ...lastRoundBets });
};
const handleResetBets = () => {
if (isSpinning) return;
setPendingBets({});
setTxFeedback({ type: '', message: '', hash: '' });
};
const totalPendingAmount = Object.values(pendingBets).reduce(
(sum, val) => +(sum + val).toFixed(4),
0
);
const selectedCarsCount = Object.keys(pendingBets).length;
const handleSubmitBatchBets = async () => {
if (isSpinning) return;
if (totalPendingAmount <= 0) {
setTxFeedback({
type: 'error',
message: 'Pilih minimal 1 mobil di showroom sebelum mengirim taruhan.',
hash: ''
});
return;
}
// MODE SIMULASI
if (gameMode === 'SIMULATION') {
if (simBalance < totalPendingAmount) {
setTxFeedback({
type: 'error',
message: 'Saldo simulasi tidak mencukupi. Kurangi nominal taruhan Anda.',
hash: ''
});
return;
}
setSimBalance((prev) => +(prev - totalPendingAmount).toFixed(4));
const updatedCommitted = { ...committedBets };
Object.entries(pendingBets).forEach(([idx, amt]) => {
updatedCommitted[idx] = +((updatedCommitted[idx] || 0) + amt).toFixed(4);
});
setCommittedBets(updatedCommitted);
setLastRoundBets({ ...pendingBets });
setPendingBets({});
playEngineRev(2.5);
setTxFeedback({
type: 'success',
message: Taruhan simulasi ${totalPendingAmount} DOGE berhasil dipasang untuk Ronde #${roundNumber}!,
hash: ''
});
return;
}
// MODE NYATA (ON-CHAIN DOGEOS CHIKYŪ TESTNET)
if (!isConnected || !address) {
openModal();
return;
}
setIsSubmitting(true);
setTxFeedback({
type: 'info',
message: 'Memeriksa jaringan DogeOS Chikyū Testnet & menyiapkan 1x transaksi batch...',
hash: ''
});
try {
await ensureDogeOSNetwork();
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
const carIndices = Object.keys(pendingBets).map((id) => Number(id));
const amountsWei = Object.values(pendingBets).map((amt) =>
ethers.parseEther(amt.toString())
);
const totalWei = ethers.parseEther(totalPendingAmount.toString());
setTxFeedback({
type: 'info',
message: 'Silakan konfirmasi 1x transaksi di dompet MyDoge / Web3 Anda...',
hash: ''
});
const tx = await contract.placeBatchBets(carIndices, amountsWei, {
value: totalWei
});
setTxFeedback({
type: 'info',
message: 'Transaksi dikirim ke blockchain! Menunggu konfirmasi blok...',
hash: tx.hash
});
await tx.wait();
const updatedCommitted = { ...committedBets };
Object.entries(pendingBets).forEach(([idx, amt]) => {
updatedCommitted[idx] = +((updatedCommitted[idx] || 0) + amt).toFixed(4);
});
setCommittedBets(updatedCommitted);
setLastRoundBets({ ...pendingBets });
setPendingBets({});
playEngineRev(2.8);
await fetchRealBalance();
setTxFeedback({
type: 'success',
message: Sukses! Taruhan ${totalPendingAmount} DOGE resmi tercatat on-chain dalam 1x transaksi.,
hash: tx.hash
});
} catch (error) {
console.error("Batch bet error:", error);
setTxFeedback({
type: 'error',
message: Transaksi dibatalkan atau gagal: ${error.reason || error.shortMessage || error.message},
hash: ''
});
} finally {
setIsSubmitting(false);
}
};
const formattedMinutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
const formattedSeconds = String(timeLeft % 60).padStart(2, '0');
const progressPercent = (timeLeft / ROUND_DURATION_SECONDS) * 100;
return (

{/* HEADER BAR */}
{/* Logo Brand */}


DL



DOGELAMBO
DogeOS Chikyū Testnet
{/* Sakelar Mode Simulasi vs Mode Nyata */}

<button
onClick={() => {
setGameMode('SIMULATION');
setTxFeedback({ type: '', message: '', hash: '' });
}}
className={px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-all ${ gameMode === 'SIMULATION' ? 'bg-cyan-400 text-black shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-white' }}
>
SIMULASI

<button
onClick={() => {
setGameMode('REAL');
setTxFeedback({ type: '', message: '', hash: '' });
}}
className={px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-all ${ gameMode === 'REAL' ? 'bg-amber-400 text-black shadow-md shadow-amber-500/30' : 'text-slate-400 hover:text-white' }}
>
MODE NYATA (DOGE)

{/* Kontrol Audio & Tombol Connect MyDoge SDK */}


<button
onClick={() => setIsMusicPlaying((p) => !p)}
className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-bo
