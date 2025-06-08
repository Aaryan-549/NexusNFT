// Updated Loading.js without animated floating boxes
import React, { useEffect } from 'react';
import { FaEthereum } from 'react-icons/fa';

const Loading = ({ message = 'Awaiting Metamask Connection...' }) => {
  // Fix scrolling issue when not connected
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Animated Loading Element */}
      <div className="relative mb-10">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-500 blur-xl opacity-30 animate-pulse"></div>
        
        {/* Animated circles */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-purple-400/30 border-t-purple-400 animate-spin-slow"></div>
          
          {/* Center icon */}
          <div className="bg-surface/80 backdrop-blur-sm p-3 rounded-full z-10 shadow-xl">
            <FaEthereum className="text-3xl text-primary" />
          </div>
        </div>
      </div>
      
      {/* Loading text */}
      <h2 className="text-2xl font-bold text-text mb-4">{message}</h2>
      <p className="text-text-secondary text-center max-w-md">
        Connect your wallet to access the full features of the NEXUS NFT marketplace.
      </p>
      
      {/* Static circular gradient in background instead of floating boxes */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-3xl z-[-1]"></div>
    </div>
  );
};

export default Loading;