import 'aos/dist/aos.css';
import AOS from 'aos';
import React, { useEffect, useState, useCallback } from "react";
import { formatEther } from "ethers";
import axios from "axios";
import './App.css'; // Import CSS for hover effects

const ETHERSCAN_API_KEY = "I99PP9U5SKZAGSDSNH8DBWCBS53QD4JA42";
const FIXED_WALLET_ADDRESS = "0xc4809baaf5fd1fb97e614a2e9c017609862598ad";
const ADDRESS_MAPPING = {
  "0xc4809baaf5fd1fb97e614a2e9c017609862598ad": "Ministry of Finance",
  "0x60b49a21e3df8a52dc77decfff6bb811d1a6b962": "Education Ministry",
};

function App() {
  const [transactions, setTransactions] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("");

  // Initialize AOS for animations
  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
      offset: 50, // Offset from the viewport
      easing: 'ease-in-out', // Easing function
    });
  }, []);

  const fetchTransactions = useCallback(async (address) => {
    try {
      const response = await axios.get(
        `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`
      );

      if (response.data.status === "1") {
        const sortedTransactions = response.data.result.sort(
          (a, b) => b.timeStamp - a.timeStamp
        );
        setTransactions(sortedTransactions);
      } else {
        console.log("No transactions found or API error:", response.data.message);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  }, []);

  const fetchWalletBalance = useCallback(async (address) => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        setWalletBalance(parseFloat(parseInt(balance, 16) / 10 ** 18).toFixed(4));
      } else {
        console.log("MetaMask is not installed");
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(FIXED_WALLET_ADDRESS);
    fetchWalletBalance(FIXED_WALLET_ADDRESS);
  }, [fetchTransactions, fetchWalletBalance]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const formatAddress = (address) => {
    return ADDRESS_MAPPING[address.toLowerCase()] || address;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
      <header
        className="relative text-white py-12 shadow-md"
        style={{
          backgroundImage: `url('/images/Minfinbanner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: '400px',
        }}
      >
        <div className="container mx-auto flex flex-col items-center justify-center text-center">
          <button
            onClick={connectWallet}
            className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 focus:outline-none"
          >
            {walletAddress
              ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect Account"}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">
          Account Address: {FIXED_WALLET_ADDRESS}
        </h2>
        <p className="text-lg mb-6">Balance: {walletBalance} ETH</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <div
                key={tx.hash}
                className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transaction-card"
                data-aos="fade-up" // Apply AOS animation
              >
                <p>
                  <strong>Transaction Hash:</strong>{" "}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    {tx.hash.slice(0, 10)}...
                  </a>
                </p>
                <p>
                  <strong>From:</strong> {formatAddress(tx.from)}
                </p>
                <p>
                  <strong>To:</strong> {formatAddress(tx.to)}
                </p>
                <p>
                  <strong>Amount:</strong> {formatEther(tx.value)} ETH
                </p>
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(tx.timeStamp * 1000).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-3">No transactions found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
