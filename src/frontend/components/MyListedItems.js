// MyListedItems.js - With Tailwind CSS
import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { FaEthereum, FaListAlt, FaDollarSign, FaTags } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Loading from './Loading';

const MyListedItems = ({ marketplace, nft, account }) => {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [activeTab, setActiveTab] = useState('listed');

  const loadListedItems = async () => {
    try {
      // Load all items that the user listed
      const itemCount = await marketplace.itemCount();
      let listedItems = [];
      let soldItems = [];
      
      for (let indx = 1; indx <= itemCount; indx++) {
        const i = await marketplace.items(indx);
        if (i.seller.toLowerCase() === account.toLowerCase()) {
          // get uri url from nft contract
          const uri = await nft.tokenURI(i.tokenId);
          // use uri to fetch the nft metadata stored on ipfs 
          const response = await fetch(uri);
          const metadata = await response.json();
          // get total price of item (item price + fee)
          const totalPrice = await marketplace.getTotalPrice(i.itemId);
          
          // define listed item object
          let item = {
            totalPrice,
            price: i.price,
            itemId: i.itemId,
            tokenId: i.tokenId,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            sold: i.sold
          };
          
          if (i.sold) {
            soldItems.push(item);
          } else {
            listedItems.push(item);
          }
        }
      }
      
      setListedItems(listedItems);
      setSoldItems(soldItems);
      setLoading(false);
    } catch (error) {
      console.error("Error loading listed items:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListedItems();
  }, []);

  const renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FaListAlt className="text-6xl text-text-secondary/30 mb-6" />
      <h3 className="text-2xl font-bold mb-3">{message}</h3>
      <p className="text-text-secondary mb-8 max-w-md">
        {activeTab === 'listed'
          ? "You don't have any NFTs currently listed on the marketplace"
          : "You haven't sold any NFTs yet"}
      </p>
      {activeTab === 'listed' && (
        <Link to="/create" className="px-8 py-3 bg-primary text-white rounded-lg font-semibold transition-all duration-200 hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20">
          Create New NFT
        </Link>
      )}
    </div>
  );

  if (loading) {
    return <Loading message="Loading your items..." />;
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-text to-primary bg-clip-text text-transparent">
            My NFT Dashboard
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Manage your listed and sold NFTs
          </p>
        </div>
        
        <div className="flex border-b border-border mb-8">
          <button 
            className={`pb-3 px-6 relative font-semibold text-lg flex items-center gap-2 ${
              activeTab === 'listed' ? 'text-primary' : 'text-text-secondary'
            }`} 
            onClick={() => setActiveTab('listed')}
          >
            <FaTags />
            <span>Listed NFTs</span>
            <span className="flex items-center justify-center bg-primary/10 text-primary text-sm font-bold h-5 min-w-5 px-1.5 rounded-full">
              {listedItems.length}
            </span>
            {activeTab === 'listed' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
          
          <button 
            className={`pb-3 px-6 relative font-semibold text-lg flex items-center gap-2 ${
              activeTab === 'sold' ? 'text-primary' : 'text-text-secondary'
            }`} 
            onClick={() => setActiveTab('sold')}
          >
            <FaDollarSign />
            <span>Sold NFTs</span>
            <span className="flex items-center justify-center bg-primary/10 text-primary text-sm font-bold h-5 min-w-5 px-1.5 rounded-full">
              {soldItems.length}
            </span>
            {activeTab === 'sold' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
        </div>
        
        <div>
          {activeTab === 'listed' && (
            <>
              {listedItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {listedItems.map((item, idx) => (
                    <div key={idx} className="bg-surface rounded-xl overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20">
                      <div className="relative overflow-hidden h-[220px]">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        />
                        <div className="absolute top-3 right-3 bg-primary/90 text-white text-xs font-bold py-1 px-3 rounded-lg shadow-md">
                          Listed
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                        <p className="text-text-secondary mb-4 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="space-y-2 py-3 border-t border-border">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Token ID:</span>
                            <span className="font-semibold">#{item.tokenId.toString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Item ID:</span>
                            <span className="font-semibold">#{item.itemId.toString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-4 bg-surface-light border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-lg font-bold text-primary">
                            <FaEthereum className="mr-1" />
                            {ethers.utils.formatEther(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                renderEmptyState("No Listed NFTs")
              )}
            </>
          )}
          
          {activeTab === 'sold' && (
            <>
              {soldItems.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-surface p-6 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl">
                        <FaDollarSign />
                      </div>
                      <div>
                        <h3 className="text-text-secondary text-sm mb-1">Total Sales</h3>
                        <p className="flex items-center text-2xl font-bold">
                          <FaEthereum className="mr-2 text-primary" />
                          {ethers.utils.formatEther(
                            soldItems.reduce((total, item) => total.add(item.price), ethers.BigNumber.from(0))
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-surface p-6 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl">
                        <FaListAlt />
                      </div>
                      <div>
                        <h3 className="text-text-secondary text-sm mb-1">NFTs Sold</h3>
                        <p className="text-2xl font-bold">{soldItems.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {soldItems.map((item, idx) => (
                      <div key={idx} className="bg-surface rounded-xl overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20">
                        <div className="relative overflow-hidden h-[220px]">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                          />
                          <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold py-1 px-3 rounded-lg shadow-md">
                            Sold
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                          <p className="text-text-secondary mb-4 line-clamp-2">
                            {item.description}
                          </p>
                          
                          <div className="space-y-2 py-3 border-t border-border">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Token ID:</span>
                              <span className="font-semibold">#{item.tokenId.toString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-4 bg-surface-light border-t border-border">
                          <div className="flex flex-col">
                            <span className="text-xs text-text-secondary mb-1">Sold for:</span>
                            <span className="flex items-center text-lg font-bold text-primary">
                              <FaEthereum className="mr-1" />
                              {ethers.utils.formatEther(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                renderEmptyState("No Sold NFTs")
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListedItems;