// Personalized Footer.js with modern design and your personal info
import React from 'react';
import { Link } from 'react-router-dom';
import { FaDiscord, FaTwitter, FaInstagram, FaGithub, FaEthereum, FaLinkedin, FaEnvelope, FaExternalLinkAlt, FaCode } from 'react-icons/fa';

const Footer = () => {
  // Your personal links
  const projectLinks = [
    { name: "GitHub", url: "https://github.com/Aaryan-549" },
    { name: "Resume", url: "https://www.scribd.com/document/861527782/Aaryan" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/aaryan-beniwal-941833292/" }
  ];

  // Your tech stack
  const techStack = [
    "Solidity", "React.js", "Next.js", "TailwindCSS", "Hardhat", "Ethereum", "Web3", "IPFS"
  ];

  return (
    <footer className="relative z-10 bg-surface/30 backdrop-blur-md mt-16 pb-8 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12">
          {/* Left side - About & Contact */}
          <div>
            {/* Brand */}
            <Link to="/" className="inline-block mb-6">
              <div className="flex items-center">
                <span className="text-3xl text-primary mr-2">♦</span>
                <span className="font-extrabold text-2xl tracking-wide">NEXUS<span className="text-primary">NFT</span></span>
              </div>
            </Link>
            
            <p className="text-text-secondary mb-6 leading-relaxed text-sm max-w-md">
              A next-generation decentralized NFT marketplace with rollup technology. Built with Solidity, React, and deployed on Sepolia testnet as a showcase of Web3 development skills.
            </p>
            
            {/* Contact */}
            <div className="mb-8">
              <h3 className="text-white text-sm font-medium mb-3 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Get in touch:
              </h3>
              <a 
                href="mailto:abeniwal_be23@thapar.edu" 
                className="text-primary hover:text-purple-400 transition-colors duration-200 flex items-center text-sm"
              >
                <FaEnvelope className="mr-2" />
                abeniwal_be23@thapar.edu
              </a>
            </div>
            
            {/* Social Links */}
            <div>
              <h3 className="text-white text-sm font-medium mb-3 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Connect with me:
              </h3>
              <div className="flex gap-3">
                <a 
                  href="https://x.com/0xaaryan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5"
                >
                  <FaTwitter />
                </a>
                <a 
                  href="https://github.com/Aaryan-549" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5"
                >
                  <FaGithub />
                </a>
                <a 
                  href="https://www.linkedin.com/in/aaryan-beniwal-941833292/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5"
                >
                  <FaLinkedin />
                </a>
                <a 
                  href="https://www.instagram.com/aaryan_549/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5"
                >
                  <FaInstagram />
                </a>
                <a 
                  href="https://www.upwork.com/freelancers/~018adee1a7a52bc65d" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-primary hover:text-white transition-all duration-200 transform hover:-translate-y-1 border border-white/5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Right side - Projects & Tech Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            {/* Navigation Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Marketplace
              </h3>
              <ul className="space-y-3 mb-8">
                <li>
                  <Link to="/" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 flex items-center">
                    <span className="inline-block mr-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Explore NFTs
                  </Link>
                </li>
                <li>
                  <Link to="/create" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 flex items-center">
                    <span className="inline-block mr-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Create
                  </Link>
                </li>
                <li>
                  <Link to="/my-listed-items" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 flex items-center">
                    <span className="inline-block mr-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                    My Listings
                  </Link>
                </li>
                <li>
                  <Link to="/my-purchases" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 flex items-center">
                    <span className="inline-block mr-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                    My Collection
                  </Link>
                </li>
              </ul>

              {/* My Projects */}
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                My Projects
              </h3>
              <ul className="space-y-3">
                {projectLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 flex items-center"
                    >
                      <span className="inline-block mr-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {link.name}
                      <FaExternalLinkAlt className="ml-1 text-xs" />
                    </a>
                  </li>
                ))}
                <li className="mt-4 pt-4 border-t border-white/10">
                  <a 
                    href="https://github.com/Aaryan-549" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:text-purple-400 transition-colors duration-200 flex items-center text-sm"
                  >
                    <FaCode className="mr-2" />
                    View All Projects
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Tech Stack */}
            <div>
              <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {techStack.map((tech, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-surface/70 backdrop-blur-sm border border-white/10 rounded-full text-sm text-text-secondary"
                  >
                    {tech}
                  </span>
                ))}
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30">
                  NFT Marketplace
                </span>
              </div>
              
              {/* Source Code Link */}
              <div className="bg-surface/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <h4 className="text-white text-sm font-medium mb-2">This Project</h4>
                <p className="text-text-secondary text-xs mb-3">
                  Open source NFT marketplace with rollup technology
                </p>
                <a 
                  href="https://github.com/Aaryan-549/NexusNFT" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:text-purple-400 transition-colors duration-200 text-sm"
                >
                  <FaGithub className="mr-2" />
                  View Source Code
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section - copyright and powered by */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-secondary text-sm mb-4 md:mb-0">
            Built by <span className="text-primary font-medium">Aaryan Beniwal</span> © {new Date().getFullYear()}
          </p>
          
          {/* Ethereum badge */}
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