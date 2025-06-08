// Updated Footer.js with modern rounded design
import React from 'react';
import { Link } from 'react-router-dom';
import { FaDiscord, FaTwitter, FaInstagram, FaGithub, FaEthereum } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="relative z-10 bg-surface/30 backdrop-blur-md mt-16 pb-8 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top section with columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <div className="flex items-center">
                <span className="text-3xl text-primary mr-2">♦</span>
                <span className="font-extrabold text-2xl tracking-wide">NEXUS<span className="text-primary">NFT</span></span>
              </div>
            </Link>
            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              The next generation NFT marketplace platform for creators and collectors.
            </p>
            
            {/* Social media links */}
            <div className="flex gap-3">
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5">
                <FaDiscord />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5">
                <FaInstagram />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5">
                <FaGithub />
              </a>
            </div>
          </div>
          
          {/* Nav columns with heading style matching the design */}
          <div>
            <h3 className="text-lg font-semibold mb-5 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Marketplace
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Explore
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Create
                </Link>
              </li>
              <li>
                <Link to="/my-listed-items" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  My Listings
                </Link>
              </li>
              <li>
                <Link to="/my-purchases" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  My Collection
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-5 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Gas-Free Minting
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Developer Docs
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Community
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-5 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom section - copyright and powered by */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-secondary text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} NEXUS NFT. All rights reserved.
          </p>
          
          {/* Ethereum badge - modern styled */}
          <div className="flex items-center text-sm px-4 py-2 rounded-full bg-surface/70 backdrop-blur-sm border border-white/5">
            <span className="text-text-secondary mr-2">Powered by</span>
            <FaEthereum className="text-primary mx-1" />
            <span className="text-text">Ethereum</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;