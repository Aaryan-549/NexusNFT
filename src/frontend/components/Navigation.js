// Fixed Navigation.js with improved mobile version
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWallet, FaList, FaShoppingCart, FaPlus, FaHome, FaEye, FaTimes } from 'react-icons/fa';

const Navigation = ({ web3Handler, account }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  // Navigation items with requirements
  const navItems = [
    {
      path: '/',
      label: 'Explore',
      icon: FaHome,
      requiresWallet: false,
      description: 'Browse all NFTs'
    },
    {
      path: '/create',
      label: 'Create',
      icon: FaPlus,
      requiresWallet: true,
      description: 'Mint new NFTs'
    },
    {
      path: '/my-listed-items',
      label: 'My Listings',
      icon: FaList,
      requiresWallet: true,
      description: 'Your listed NFTs'
    },
    {
      path: '/my-purchases',
      label: 'My Collection',
      icon: FaShoppingCart,
      requiresWallet: true,
      description: 'Your purchases'
    }
  ];

  const NavLink = ({ item, isMobile = false }) => {
    const isActive = location.pathname === item.path;
    const needsWallet = item.requiresWallet && !account;
    
    const baseClasses = `flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
      isMobile ? 'text-lg w-full justify-start' : ''
    }`;
    
    const activeClasses = isActive 
      ? 'bg-primary/20 text-primary font-semibold border border-primary/30' 
      : needsWallet
        ? 'text-text-secondary/60 hover:text-text-secondary hover:bg-white/5'
        : 'text-text-secondary hover:bg-white/10 hover:text-text';

    if (needsWallet) {
      return (
        <button
          onClick={() => {
            web3Handler();
            if (isMobile) setMenuOpen(false);
          }}
          className={`${baseClasses} ${activeClasses} cursor-pointer relative`}
          title={`Connect wallet to ${item.description.toLowerCase()}`}
        >
          <item.icon className={isMobile ? "text-xl" : ""} />
          <span>{item.label}</span>
          <div className="flex items-center gap-1 ml-auto">
            <FaWallet className="text-xs opacity-60" />
            {isMobile && <span className="text-xs opacity-60">Connect</span>}
          </div>
        </button>
      );
    }

    return (
      <Link 
        to={item.path}
        className={`${baseClasses} ${activeClasses}`}
        title={item.description}
        onClick={() => isMobile && setMenuOpen(false)}
      >
        <item.icon className={isMobile ? "text-xl" : ""} />
        <span>{item.label}</span>
        {isActive && isMobile && (
          <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
        )}
      </Link>
    );
  };

  return (
    <header className={`sticky top-0 left-0 w-full z-50 py-4 px-4 transition-all duration-300 ${
      isScrolled ? 'bg-background/90 backdrop-blur-md' : 'bg-background/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Modern, contained navbar with rounded edges */}
        <div className="flex items-center justify-between p-1 bg-surface/60 backdrop-blur-md rounded-full border border-white/5 shadow-lg">
          {/* Logo section */}
          <Link to="/" className="flex items-center pl-4 text-text no-underline">
            <div className="flex items-center">
              <span className="text-3xl text-primary mr-2">♦</span>
              <span className="font-extrabold text-xl tracking-wide">NEXUS<span className="text-primary">NFT</span></span>
            </div>
          </Link>

          {/* Mobile menu button */}
          <button 
            className={`lg:hidden relative z-50 w-10 h-10 flex items-center justify-center mr-2 rounded-full transition-all duration-300 ${
              menuOpen ? 'bg-primary/20' : 'hover:bg-white/10'
            }`} 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <FaTimes className="text-primary text-lg" />
            ) : (
              <div className="flex flex-col space-y-1">
                <span className="h-0.5 bg-text rounded-sm w-5 transition-all duration-300"></span>
                <span className="h-0.5 bg-text rounded-sm w-5 transition-all duration-300"></span>
                <span className="h-0.5 bg-text rounded-sm w-5 transition-all duration-300"></span>
              </div>
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <ul className="flex items-center gap-1 p-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Wallet Connection */}
          <div className="hidden lg:flex pl-2 pr-1">
            {account ? (
              <div className="flex items-center gap-2">
                {/* Connection status indicator */}
                <div className="hidden xl:flex items-center px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-600 text-xs font-medium">Connected</span>
                </div>
                
                {/* Account info */}
                <a
                  href={`https://sepolia.etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-primary to-purple-400 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  title="View on Etherscan"
                >
                  <FaWallet className="mr-2" />
                  <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                </a>
              </div>
            ) : (
              <button 
                onClick={web3Handler} 
                className="flex items-center px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-primary/90 to-purple-400 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                <FaWallet className="mr-2" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background"
            onClick={() => setMenuOpen(false)}
          ></div>
          
          {/* Menu Content */}
          <div className="relative h-full flex flex-col bg-background">
            {/* Header Spacer */}
            <div className="h-20 bg-gradient-to-b from-background to-background border-b border-white/10"></div>
            
            {/* Main Menu Content */}
            <div className="flex-1 px-6 py-8 overflow-y-auto bg-background">
              {/* Connection Status */}
              <div className="text-center mb-8">
                {account ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-green-600 text-sm font-medium">Wallet Connected</span>
                    </div>
                    <div className="bg-surface border border-white/10 rounded-lg p-4">
                      <p className="text-text-secondary text-sm mb-2">Connected Address:</p>
                      <a
                        href={`https://sepolia.etherscan.io/address/${account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-mono text-sm hover:text-purple-400 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        {account.slice(0, 10)}...{account.slice(-10)}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                      <FaEye className="text-yellow-600 mr-2" />
                      <span className="text-yellow-600 text-sm font-medium">Browsing Mode</span>
                    </div>
                    <p className="text-text-secondary text-sm">Connect wallet for full features</p>
                  </div>
                )}
              </div>
              
              {/* Navigation Links */}
              <div className="space-y-2 mb-8">
                {navItems.map((item) => (
                  <NavLink key={item.path} item={item} isMobile />
                ))}
              </div>
              
              {/* Mobile Wallet Button */}
              {!account && (
                <div className="mt-auto pt-6 border-t border-white/10">
                  <button 
                    onClick={() => {
                      web3Handler();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full text-white font-semibold bg-gradient-to-r from-primary to-purple-400 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  >
                    <FaWallet />
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;