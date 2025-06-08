// Fixed Home.js - Complete and error-free
import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { FaShoppingCart, FaEthereum, FaImage, FaArrowRight, FaRegLightbulb, FaPaintBrush, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Home = ({ marketplace, nft, isWalletConnected = false, walletMarketplace }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [featuredItem, setFeaturedItem] = useState(null);
  const [loadingError, setLoadingError] = useState('');
  const [purchasing, setPurchasing] = useState(null);

  const loadMarketplaceItems = async () => {
    try {
      setLoading(true);
      setLoadingError('');
      
      // Check if contracts are available
      if (!marketplace || !nft) {
        console.log('Contracts not available yet');
        setLoadingError('Marketplace contracts not loaded. Try connecting your wallet or refresh the page.');
        setLoading(false);
        return;
      }

      // Check if contracts have the required methods
      if (typeof marketplace.itemCount !== 'function' || typeof nft.tokenURI !== 'function') {
        console.log('Contracts not properly initialized');
        setLoadingError('Contracts not properly initialized. Please refresh the page.');
        setLoading(false);
        return;
      }

      console.log('Loading marketplace items...');
      
      // Load all unsold items
      const itemCount = await marketplace.itemCount();
      console.log('Total items in marketplace:', itemCount.toString());
      
      let items = [];
      
      for (let i = 1; i <= itemCount; i++) {
        try {
          const item = await marketplace.items(i);
          
          if (!item.sold) {
            console.log(`Loading metadata for item ${i}...`);
            
            // get uri url from nft contract
            const uri = await nft.tokenURI(item.tokenId);
            
            // use uri to fetch the nft metadata stored on ipfs with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            try {
              const response = await fetch(uri, {
                signal: controller.signal,
                headers: {
                  'Accept': 'application/json',
                }
              });
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                console.error(`Failed to fetch metadata for item ${i}:`, response.statusText);
                continue;
              }
              
              const metadata = await response.json();
              
              // get total price of item (item price + fee)
              const totalPrice = await marketplace.getTotalPrice(item.itemId);
              
              // Add item to items array
              items.push({
                totalPrice,
                itemId: item.itemId,
                seller: item.seller,
                name: metadata.name,
                description: metadata.description,
                image: metadata.image
              });
            } catch (fetchError) {
              clearTimeout(timeoutId);
              console.error(`Error fetching metadata for item ${i}:`, fetchError.message);
              // Continue with other items
            }
          }
        } catch (itemError) {
          console.error(`Error loading item ${i}:`, itemError);
          // Continue with other items
        }
      }
      
      console.log('Successfully loaded items:', items.length);
      
      // Set featured item if items exist
      if (items.length > 0) {
        const randomIndex = Math.floor(Math.random() * items.length);
        setFeaturedItem(items[randomIndex]);
      }
      
      setItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Error loading marketplace items:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes('could not detect network')) {
        errorMessage = 'Network connection issue. Try connecting your wallet or check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The network might be slow. Try again in a moment.';
      } else if (error.message.includes('Contract call failed')) {
        errorMessage = 'Unable to connect to the marketplace. Please try again.';
      }
      
      setLoadingError(errorMessage);
      setLoading(false);
    }
  };

  const buyMarketItem = async (item) => {
    if (!isWalletConnected) {
      alert('Please connect your wallet to purchase items');
      return;
    }

    if (!walletMarketplace) {
      alert('Wallet contracts not loaded. Please refresh and try again.');
      return;
    }

    try {
      setPurchasing(item.itemId.toString());
      console.log('Purchasing item:', item);
      
      const tx = await walletMarketplace.purchaseItem(item.itemId, { value: item.totalPrice });
      console.log('Purchase transaction:', tx.hash);
      
      alert(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`);
      
      await tx.wait();
      console.log('Purchase confirmed');
      
      alert('Purchase successful! 🎉');
      
      // Reload items after purchase
      await loadMarketplaceItems();
    } catch (error) {
      console.error("Error buying item:", error);
      
      let errorMessage = 'Purchase failed';
      if (error.message.includes('user rejected transaction')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this purchase';
      } else {
        errorMessage = `Purchase failed: ${error.message.slice(0, 100)}`;
      }
      
      alert(errorMessage);
    } finally {
      setPurchasing(null);
    }
  };

  // Load items when contracts become available
  useEffect(() => {
    console.log('Home component updated - Marketplace:', !!marketplace, 'NFT:', !!nft);
    loadMarketplaceItems();
  }, [marketplace, nft]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
        </div>
        <p className="mt-4 text-text-secondary text-center">
          {marketplace && nft ? 'Loading marketplace items...' : 'Connecting to marketplace...'}
        </p>
        <p className="mt-2 text-sm text-text-secondary/70">
          This may take a moment...
        </p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-yellow-600 mb-4">Connection Issue</h3>
          <p className="text-yellow-700 mb-6 text-sm">{loadingError}</p>
          
          <div className="space-y-3">
            <button 
              onClick={loadMarketplaceItems}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            
            {window.ethereum && !isWalletConnected && (
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
          
          <p className="text-xs text-yellow-600 mt-4">
            If this persists, try connecting your MetaMask wallet or check your internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <section className="relative mt-8 mb-20">
          {/* Hero decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-400/5 rounded-3xl overflow-hidden -z-10">
            <div className="absolute w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMykiIGQ9Ik02MCAzMEgwdjMwaDYwVjMweiIvPjxwYXRoIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMykiIGQ9Ik0zMCAwSDB2MzBoMzBWMHoiLz48L2c+PC9zdmc+')] opacity-20"></div>
            
            {/* Floating shapes */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full blur-2xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-float-slow"></div>
          </div>
          
          {/* Hero content */}
          <div className="py-16 px-6 md:px-10 flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-text to-primary bg-clip-text text-transparent">Discover, Collect & Sell</span>
                <br/>
                <span className="text-text">Extraordinary NFTs</span>
              </h1>
              
              <p className="text-lg text-text-secondary mb-8 max-w-lg">
                Explore the next generation NFT marketplace. Browse all NFTs freely, connect your wallet only when you're ready to buy or create.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/create" className="px-6 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                  Create NFT <FaArrowRight />
                </Link>
                
                <button 
                  onClick={loadMarketplaceItems}
                  className="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-text rounded-full font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  Refresh
                </button>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-4 mt-8 p-4 bg-surface/30 backdrop-blur-sm rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    marketplace && nft ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm">
                    {marketplace && nft 
                      ? (isWalletConnected ? 'Connected & Ready' : 'Browse Mode') 
                      : 'Connecting...'}
                  </span>
                </div>
                <div className="text-sm text-text-secondary">
                  {items.length} NFTs Available
                </div>
              </div>
            </div>
            
            {/* Featured artwork showcase */}
            <div className="md:w-1/2 z-10">
              <div className="relative">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                  
                  <div className="relative bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl transform transition-all duration-500 group-hover:-translate-y-1">
                    {featuredItem ? (
                      <>
                        <div className="h-60 overflow-hidden">
                          <img src={featuredItem.image} alt={featuredItem.name} className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="p-5">
                          <h3 className="text-xl font-bold mb-2">{featuredItem.name}</h3>
                          <p className="text-text-secondary line-clamp-2 mb-4">
                            {featuredItem.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-primary font-bold">
                              <FaEthereum className="mr-1" />
                              <span>{ethers.utils.formatEther(featuredItem.totalPrice)}</span>
                            </div>
                            <button 
                              onClick={() => buyMarketItem(featuredItem)}
                              disabled={purchasing === featuredItem.itemId.toString()}
                              className={`px-4 py-2 rounded-full transition-colors font-semibold ${
                                isWalletConnected 
                                  ? 'bg-primary text-white hover:bg-primary/90' 
                                  : 'bg-gray-600 text-gray-300'
                              }`}
                            >
                              {purchasing === featuredItem.itemId.toString() ? (
                                <>
                                  <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                  Buying...
                                </>
                              ) : isWalletConnected ? (
                                <>
                                  <FaShoppingCart className="inline mr-1" /> Buy Now
                                </>
                              ) : (
                                <>
                                  <FaWallet className="inline mr-1" /> Connect to Buy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-[352px] flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <FaImage className="text-2xl text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {items.length === 0 ? 'No NFTs Yet' : 'Explore Collection'}
                        </h3>
                        <p className="text-text-secondary mb-6">
                          {items.length === 0 
                            ? 'Be the first to create and list an NFT!' 
                            : 'Check out the amazing NFTs below!'
                          }
                        </p>
                        <Link to="/create" className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                          Create NFT
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Feature Benefits Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-surface/80">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FaRegLightbulb className="text-2xl text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Browse Freely</h3>
              <p className="text-text-secondary">
                Explore all NFTs without connecting a wallet. Connect only when you're ready to buy or create.
              </p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-surface/80">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FaPaintBrush className="text-2xl text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Create & Sell</h3>
              <p className="text-text-secondary">
                Mint your artwork as NFTs and sell them on our marketplace with low fees and instant listings.
              </p>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-surface/80">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FaEthereum className="text-2xl text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Transactions</h3>
              <p className="text-text-secondary">
                Built on Ethereum blockchain for secure, transparent, and decentralized transactions.
              </p>
            </div>
          </div>
        </section>
        
        {/* Marketplace section */}
        <section className="relative">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold relative inline-block">
              <span className="relative z-10">Available NFTs ({items.length})</span>
              <div className="absolute -bottom-1 left-0 h-1 w-1/2 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
            </h2>
            
            <button 
              onClick={loadMarketplaceItems}
              className="text-primary font-semibold flex items-center hover:underline"
            >
              Refresh <FaArrowRight className="ml-2" />
            </button>
          </div>
          
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item, idx) => (
                <div key={idx} className="group relative">
                  {/* Card glow effect on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                  
                  {/* Card content */}
                  <div className="relative bg-surface border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">#{item.itemId.toString()}</span>
                      </div>
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center text-primary font-bold">
                          <FaEthereum className="mr-1" />
                          <span>{ethers.utils.formatEther(item.totalPrice)}</span>
                        </div>
                        <button 
                          onClick={() => buyMarketItem(item)}
                          disabled={purchasing === item.itemId.toString()}
                          className={`px-3 py-1.5 rounded-full transition-colors duration-300 text-sm font-medium ${
                            purchasing === item.itemId.toString()
                              ? 'bg-primary/50 text-white cursor-wait'
                              : isWalletConnected 
                                ? 'bg-primary/10 hover:bg-primary text-primary hover:text-white' 
                                : 'bg-gray-600/20 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {purchasing === item.itemId.toString() ? (
                            <>
                              <div className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1"></div>
                              Buying...
                            </>
                          ) : isWalletConnected ? (
                            'Buy Now'
                          ) : (
                            <>
                              <FaWallet className="inline mr-1" /> Connect
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface/30 backdrop-blur-sm border border-white/5 rounded-2xl">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-400/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-full h-full bg-surface/50 rounded-full flex items-center justify-center border border-white/10">
                  <FaImage className="text-4xl text-primary/70" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">No NFTs Listed Yet</h3>
              <p className="text-text-secondary max-w-md mx-auto mb-8">
                Be the first to create and list an NFT on the marketplace! Start your journey in the decentralized art world.
              </p>
              <div className="flex gap-4">
                <Link to="/create" className="px-8 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                  Create NFT
                </Link>
                <button 
                  onClick={loadMarketplaceItems}
                  className="px-8 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-text rounded-full font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;