// Simple App.js - Public browsing with better fallbacks
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ethers } from "ethers";
import Navigation from './Navigation';
import Home from './Home';
import Create from './Create';
import MyListedItems from './MyListedItems';
import MyPurchases from './MyPurchases';
import Footer from './Footer';
import Loading from './Loading';

// Import contract data
import MarketplaceAbi from '../contractsData/MarketplaceWithRollup.json'
import MarketplaceAddress from '../contractsData/MarketplaceWithRollup-address.json'
import NFTAbi from '../contractsData/EnhancedNFT.json'
import NFTAddress from '../contractsData/EnhancedNFT-address.json'
import BatchProcessorAbi from '../contractsData/BatchProcessor.json'
import BatchProcessorAddress from '../contractsData/BatchProcessor-address.json'

function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  
  // Wallet-connected contracts (for transactions)
  const [nft, setNFT] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [batchProcessor, setBatchProcessor] = useState(null);
  
  // Public read-only contracts (for viewing)
  const [publicNft, setPublicNft] = useState(null);
  const [publicMarketplace, setPublicMarketplace] = useState(null);
  
  const [error, setError] = useState('');

  // Create a read-only provider - try multiple approaches
  const createReadOnlyProvider = async () => {
    console.log('Attempting to create read-only provider...');
    
    // Method 1: Try using MetaMask provider in read-only mode (if available)
    if (window.ethereum) {
      try {
        console.log('Trying MetaMask provider in read-only mode...');
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Test the connection without requesting accounts
        await provider.getNetwork();
        console.log('✅ MetaMask provider working for read-only access');
        return provider;
      } catch (error) {
        console.log('MetaMask provider failed:', error.message);
      }
    }
    
    // Method 2: Try a simple public RPC
    const publicRPCs = [
      'https://rpc.sepolia.org',
      'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
    ];
    
    for (const rpcUrl of publicRPCs) {
      try {
        console.log(`Trying public RPC: ${rpcUrl}`);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Test with a short timeout
        const networkPromise = provider.getNetwork();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        await Promise.race([networkPromise, timeoutPromise]);
        console.log(`✅ Public RPC working: ${rpcUrl}`);
        return provider;
      } catch (error) {
        console.log(`Failed RPC ${rpcUrl}:`, error.message);
      }
    }
    
    // Method 3: Use ethers default provider as last resort
    try {
      console.log('Trying ethers default provider...');
      const provider = ethers.getDefaultProvider('sepolia');
      
      // Test it
      await provider.getNetwork();
      console.log('✅ Default provider working');
      return provider;
    } catch (error) {
      console.log('Default provider failed:', error.message);
    }
    
    throw new Error('All provider methods failed');
  };

  // Load read-only contracts for public viewing
  const loadPublicContracts = async () => {
    try {
      console.log('Loading public contracts for browsing...');
      
      // Validate contract addresses exist
      if (!MarketplaceAddress?.address || !NFTAddress?.address) {
        throw new Error('Contract addresses not found. Make sure contracts are deployed.');
      }

      if (!MarketplaceAbi?.abi || !NFTAbi?.abi) {
        throw new Error('Contract ABIs not found. Make sure contracts are compiled.');
      }

      console.log('Contract addresses found:');
      console.log('Marketplace:', MarketplaceAddress.address);
      console.log('NFT:', NFTAddress.address);

      // Get a working provider
      const provider = await createReadOnlyProvider();
      
      // Create read-only contract instances
      const publicMarketplace = new ethers.Contract(
        MarketplaceAddress.address, 
        MarketplaceAbi.abi, 
        provider
      );
      setPublicMarketplace(publicMarketplace);
      
      const publicNft = new ethers.Contract(
        NFTAddress.address, 
        NFTAbi.abi, 
        provider
      );
      setPublicNft(publicNft);
      
      // Test the contracts
      try {
        console.log('Testing contract connectivity...');
        const itemCount = await publicMarketplace.itemCount();
        const tokenCount = await publicNft.tokenCount();
        console.log('✅ Contracts working! Items:', itemCount.toString(), 'Tokens:', tokenCount.toString());
      } catch (testError) {
        console.warn('Contract test warning:', testError.message);
        // Continue anyway - might be no items yet
      }
      
      setLoading(false);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error("Error loading public contracts:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // MetaMask Login/Connect (only for transactions)
  const web3Handler = async () => {
    try {
      setError('');
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to create or buy NFTs.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please make sure MetaMask is unlocked.');
      }

      setAccount(accounts[0]);
      
      // Get provider from Metamask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Check network
      const network = await provider.getNetwork();
      console.log('Wallet connected to network:', network.name, 'Chain ID:', network.chainId);

      // Set up event listeners
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      window.ethereum.on('accountsChanged', async function (accounts) {
        if (accounts.length === 0) {
          setAccount(null);
          setNFT(null);
          setMarketplace(null);
          setBatchProcessor(null);
        } else {
          setAccount(accounts[0]);
          await loadWalletContracts(signer);
        }
      });
      
      await loadWalletContracts(signer);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setError(error.message);
    }
  };

  // Load contracts with wallet connection (for transactions)
  const loadWalletContracts = async (signer) => {
    try {
      console.log('Loading wallet contracts for transactions...');
      
      const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer);
      setMarketplace(marketplace);
      
      const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
      setNFT(nft);
      
      const batchProcessor = new ethers.Contract(
        BatchProcessorAddress.address,
        BatchProcessorAbi.abi,
        signer
      );
      setBatchProcessor(batchProcessor);
      
      console.log('✅ Wallet contracts loaded');
    } catch (error) {
      console.error("Error loading wallet contracts:", error);
      // Don't set error here as public browsing should still work
    }
  };

  // Initialize app
  useEffect(() => {
    document.body.style.overflow = 'auto';
    
    const initializeApp = async () => {
      try {
        // Always try to load public contracts first
        await loadPublicContracts();
        
        // Then check for existing wallet connection (optional)
        if (window.ethereum && window.ethereum.selectedAddress) {
          console.log('Found existing wallet connection, connecting...');
          await web3Handler();
        }
      } catch (error) {
        console.error('App initialization error:', error);
        // Don't set loading to false here, let loadPublicContracts handle it
      }
    };
    
    initializeApp();
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Component that requires wallet connection
  const WalletRequiredComponent = ({ feature }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-8 max-w-md">
        <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
        <p className="text-text-secondary mb-6">
          You need to connect your wallet to {feature}
        </p>
        <button 
          onClick={web3Handler}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-background text-text overflow-x-hidden">
        {/* Background decorative elements */}
        <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-purple-500/10 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute inset-0 opacity-20"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <Navigation web3Handler={web3Handler} account={account} />
          <main className="flex-1">
            {loading ? (
              <Loading message="Loading marketplace..." />
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 max-w-lg text-center">
                  <h3 className="text-xl font-bold text-yellow-600 mb-3">Network Connection Issue</h3>
                  <p className="text-yellow-700 mb-4 text-sm">
                    Having trouble connecting to the blockchain. You can still browse if you connect MetaMask.
                  </p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        setError('');
                        setLoading(true);
                        loadPublicContracts();
                      }}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                    {window.ethereum && (
                      <button 
                        onClick={() => {
                          web3Handler();
                          setError('');
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Connect MetaMask & Browse
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-yellow-600 mt-4">
                    {error}
                  </p>
                </div>
              </div>
            ) : (
             <Routes>
                {/* Home - Uses available contracts (public or wallet) */}
                <Route path="/" element={
                  <Home 
                    marketplace={publicMarketplace || marketplace}
                    nft={publicNft || nft}
                    batchProcessor={null}
                    isWalletConnected={!!account}
                    walletMarketplace={marketplace} // For purchases
                  />
                } />
                
                {/* Create - Requires wallet */}
                <Route path="/create" element={
                  account ? (
                    <Create marketplace={marketplace} nft={nft} batchProcessor={batchProcessor} />
                  ) : (
                    <WalletRequiredComponent feature="create NFTs" />
                  )
                } />
                
                {/* My Listed Items - Requires wallet */}
                <Route path="/my-listed-items" element={
                  account ? (
                    <MyListedItems 
                      marketplace={marketplace} 
                      nft={nft} 
                      account={account} 
                      batchProcessor={batchProcessor} 
                    />
                  ) : (
                    <WalletRequiredComponent feature="view your listings" />
                  )
                } />
                
                {/* My Purchases - Requires wallet */}
                <Route path="/my-purchases" element={
                  account ? (
                    <MyPurchases 
                      marketplace={marketplace} 
                      nft={nft} 
                      account={account} 
                      batchProcessor={batchProcessor} 
                    />
                  ) : (
                    <WalletRequiredComponent feature="view your purchases" />
                  )
                } />
              </Routes>
            )}
          </main>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;