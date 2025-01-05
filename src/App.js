import React, { useEffect, useState, useCallback } from "react";
import { formatEther } from "ethers";
import axios from "axios";

const ETHERSCAN_API_KEY = "I99PP9U5SKZAGSDSNH8DBWCBS53QD4JA42"; // Replace with your API key
const FIXED_WALLET_ADDRESS = "0xc4809baaf5fd1fb97e614a2e9c017609862598ad"; // Replace with a wallet address
const ADDRESS_MAPPING = {
  "0xc4809baaf5fd1fb97e614a2e9c017609862598ad": "Ministry of Finance",
  "0x60b49a21e3df8a52dc77decfff6bb811d1a6b962": "Education Ministry",
};

function App() {
  const [transactions, setTransactions] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("");

  // Memoized fetchTransactions to avoid unnecessary re-creation
  const fetchTransactions = useCallback(async (address) => {
    try {
      const response = await axios.get(
        `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`
      );

      if (response.data.status === "1") {
        const sortedTransactions = response.data.result.sort(
          (a, b) => b.timeStamp - a.timeStamp
        );

        if (
          sortedTransactions.length !== transactions.length ||
          sortedTransactions[0]?.hash !== transactions[0]?.hash
        ) {
          setTransactions(sortedTransactions);
        }
      } else {
        console.log("No transactions found or API error:", response.data.message);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  }, [transactions]);

  const fetchWalletBalance = useCallback(async (address) => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        setWalletBalance(parseFloat(parseInt(balance, 16) / 10 ** 18).toFixed(4)); // Convert Wei to Ether
      } else {
        console.log("MetaMask is not installed");
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(FIXED_WALLET_ADDRESS);
    getCurrentWalletConnected();
    addWalletListener();
  }, [fetchTransactions]);

  useEffect(() => {
    const updateBalance = () => fetchWalletBalance(FIXED_WALLET_ADDRESS);
    updateBalance(); // Fetch immediately
    const intervalId = setInterval(updateBalance, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchWalletBalance]);

  useEffect(() => {
    const updateTransactions = () => fetchTransactions(FIXED_WALLET_ADDRESS);
    updateTransactions(); // Fetch immediately
    const intervalId = setInterval(updateTransactions, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchTransactions]);

  const formatAddress = (address) => {
    const lowerCaseAddress = address.toLowerCase();
    return ADDRESS_MAPPING[lowerCaseAddress] || address;
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        console.log("Connected wallet:", accounts[0]);
      } catch (err) {
        console.error("Error connecting wallet:", err.message);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("Current wallet connected:", accounts[0]);
        } else {
          console.log("No wallet connected. Use the Connect Wallet button.");
        }
      } catch (err) {
        console.error("Error checking current wallet:", err.message);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const addWalletListener = () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("Wallet changed:", accounts[0]);
        } else {
          setWalletAddress("");
          console.log("No wallet connected");
        }
      });
    } else {
      console.log("MetaMask is not installed");
    }
  };

  return (
    <div
      className="relative flex flex-col items-center min-h-screen"
      style={{
        backgroundColor: "#f5f5f5",
        color: "#333333",
        fontFamily: "'Arial', sans-serif",
      }}
    >
      <header className="w-full py-6 px-6 shadow-md bg-gray-200">
        <div className="text-center">
          <h1 className="text-4xl font-bold uppercase tracking-widest" style={{ letterSpacing: "2px" }}>
            Ministry of Finance
          </h1>
          <p className="mt-2 text-lg font-medium">ADDRESS: {FIXED_WALLET_ADDRESS}</p>
        </div>
        <p>Balance: {walletBalance} ETH</p>
        <button
          onClick={connectWallet}
          className="absolute top-6 right-6 px-6 py-2 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-400 focus:outline-none"
        >
          {walletAddress && walletAddress.length > 0
            ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(
                38
              )}`
            : "Connect Wallet"}
        </button>
      </header>

      <div className="w-full max-w-7xl mt-6 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-200 py-6 px-4 shadow-md rounded-md">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div
                key={tx.hash}
                className="bg-white p-4 shadow-md rounded-md border border-gray-300"
              >
                <p className="text-sm font-semibold">
                  <strong>Transaction Hash:</strong>{" "}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {tx.hash.substring(0, 10)}...
                  </a>
                </p>
                <p className="text-sm">
                  <strong>From:</strong> {formatAddress(tx.from)}
                </p>
                <p className="text-sm">
                  <strong>To:</strong> {formatAddress(tx.to)}
                </p>
                <p className="text-sm">
                  <strong>Amount:</strong> {formatEther(tx.value)} ETH
                </p>
                <p className="text-sm">
                  <strong>Timestamp:</strong>{" "}
                  {new Date(tx.timeStamp * 1000).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-3">
              No transactions found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
