// MyPurchases.js - With Tailwind CSS
import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { FaEthereum, FaShoppingBag, FaCreditCard } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Loading from './Loading';

const MyPurchases = ({ marketplace, nft, account }) => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [totalSpent, setTotalSpent] = useState(ethers.BigNumber.from(0));

  const loadPurchasedItems = async () => {
    try {
      // Fetch purchased items from marketplace by querying Bought events with the buyer set as the user
      const filter = marketplace.filters.Bought(null, null, null, null, null, account);
      const results = await marketplace.queryFilter(filter);
      
      // Fetch metadata of each nft and add that to listedItem object
      const purchases = await Promise.all(results.map(async i => {
        // fetch arguments from each result
        i = i.args;
        // get uri url from nft contract
        const uri = await nft.tokenURI(i.tokenId);
        // use uri to fetch the nft metadata stored on ipfs 
        const response = await fetch(uri);
        const metadata = await response.json();
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(i.itemId);
        
        // define purchased item object
        return {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          tokenId: i.tokenId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          seller: i.seller
        };
      }));
      
      // Calculate total spent
      const totalSpentAmount = purchases.reduce(
        (total, item) => total.add(item.price), 
        ethers.BigNumber.from(0)
      );
      
      setPurchases(purchases);
      setTotalSpent(totalSpentAmount);
      setLoading(false);
    } catch (error) {
      console.error("Error loading purchased items:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchasedItems();
  }, []);

  if (loading) {
    return <Loading message="Loading your purchases..." />;
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-text to-primary bg-clip-text text-transparent">
            My Collection
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            View all the NFTs you've acquired from the marketplace
          </p>
        </div>
        
        {purchases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-surface p-6 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 flex items-center gap-5">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl">
                  <FaShoppingBag />
                </div>
                <div>
                  <h3 className="text-text-secondary text-sm mb-1">Total Purchases</h3>
                  <p className="text-2xl font-bold">{purchases.length}</p>
                </div>
              </div>
              
              <div className="bg-surface p-6 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 flex items-center gap-5">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl">
                  <FaCreditCard />
                </div>
                <div>
                  <h3 className="text-text-secondary text-sm mb-1">Total Spent</h3>
                  <p className="flex items-center text-2xl font-bold">
                    <FaEthereum className="mr-2 text-primary" />
                    {ethers.utils.formatEther(totalSpent)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {purchases.map((item, idx) => (
                <div key={idx} className="bg-surface rounded-xl overflow-hidden border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20">
                  <div className="relative overflow-hidden h-[220px]">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                    />
                    <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold py-1 px-3 rounded-lg shadow-md">
                      Owned
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
                        <span className="text-text-secondary">Seller:</span>
                        <span className="font-medium text-primary">
                          {item.seller.slice(0, 6) + '...' + item.seller.slice(38, 42)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 bg-surface-light border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-xs text-text-secondary mb-1">Purchased for:</span>
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FaShoppingBag className="text-6xl text-text-secondary/30 mb-6" />
            <h3 className="text-2xl font-bold mb-3">No Purchases Yet</h3>
            <p className="text-text-secondary mb-8 max-w-md">
              You haven't purchased any NFTs from the marketplace yet
            </p>
            <Link to="/" className="px-8 py-3 bg-primary text-white rounded-lg font-semibold transition-all duration-200 hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20">
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;