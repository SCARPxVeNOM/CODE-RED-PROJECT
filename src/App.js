import React, { useEffect, useState } from "react";
import { formatEther } from "ethers";
import axios from "axios";

const ETHERSCAN_API_KEY = "I99PP9U5SKZAGSDSNH8DBWCBS53QD4JA42"; // Replace with your key
const FIXED_WALLET_ADDRESS = "0xC4809BAaF5fd1fb97e614A2e9c017609862598AD"; // Replace with the wallet address you want to track

function App() {
  const [walletAddress, setWalletAddress] = useState("Wallet address will appear here");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions(FIXED_WALLET_ADDRESS); // Fetch transactions for the fixed wallet on load
    getCurrentWalletConnected();
    addWalletListener();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        console.log(accounts[0]);
      } catch (err) {
        console.error(err.message);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          console.log("Connect to MetaMask using the Connect button");
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const addWalletListener = async () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0]);
      });
    }
  };

  const fetchTransactions = async (address) => {
    try {
      const response = await axios.get(
        `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`
      );
      if (response.data.status === "1") {
        setTransactions(response.data.result);
      } else {
        console.log("No transactions found or error in API call");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        fontFamily: "'Arial', sans-serif",
      }}
    >
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-light text-gray-300">Ministry</h1>
          <h2 className="text-4xl font-light text-white">of Finance</h2>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={connectWallet}
            className="px-6 py-3 mb-4 text-lg font-medium text-white bg-gray-700 rounded-full shadow-lg hover:bg-gray-600 focus:outline-none"
          >
            <span className="is-link has-text-weight-bold">
              {walletAddress && walletAddress.length > 0
                ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`
                : "Connect Wallet"}
            </span>
          </button>
          <p className="text-sm text-gray-400">{walletAddress}</p>
        </div>

        {/* Transactions Section */}
        <div className="mt-8">
          <h3 className="text-2xl text-white mb-4">Transactions</h3>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table
                className="table-auto w-full text-left border-collapse border border-gray-700"
                style={{ backgroundColor: "#2c2c2c", color: "#ffffff" }}
              >
                <thead>
                  <tr className="bg-gray-800">
                    <th className="py-2 px-4 border border-gray-700">Hash</th>
                    <th className="py-2 px-4 border border-gray-700">From</th>
                    <th className="py-2 px-4 border border-gray-700">To</th>
                    <th className="py-2 px-4 border border-gray-700">Amount (ETH)</th>
                    <th className="py-2 px-4 border border-gray-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr
                      key={tx.hash}
                      className={index % 2 === 0 ? "bg-gray-700" : "bg-gray-600"}
                    >
                      <td className="py-2 px-4 border border-gray-700">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          {tx.hash.substring(0, 10)}...
                        </a>
                      </td>
                      <td className="py-2 px-4 border border-gray-700">{tx.from}</td>
                      <td className="py-2 px-4 border border-gray-700">{tx.to}</td>
                      <td className="py-2 px-4 border border-gray-700">
                        {formatEther(tx.value)} ETH
                      </td>
                      <td className="py-2 px-4 border border-gray-700">
                        {new Date(tx.timeStamp * 1000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
