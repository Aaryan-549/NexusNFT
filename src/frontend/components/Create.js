// Fixed Create.js with proper error handling and IPFS upload
import React, { useState } from 'react';
import { ethers } from "ethers";
import { FaCloudUploadAlt, FaEthereum, FaImage, FaExclamationTriangle } from 'react-icons/fa';

const Create = ({ marketplace, nft }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });
  
  const [imageUrl, setImageUrl] = useState('');
  const [fileObj, setFileObj] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [transactionHash, setTransactionHash] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadFileToIPFS = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', pinataOptions);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': '772d16cd57f3ecc7ecbc',
          'pinata_secret_api_key': '8f5fb65e5c941a395d7a61d5ac0cd41cd98a788e20da89d084ec7f84f7a9f939',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw new Error(`Failed to upload image to IPFS: ${error.message}`);
    }
  };

  const uploadJSONToIPFS = async (metadata) => {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': '772d16cd57f3ecc7ecbc',
          'pinata_secret_api_key': '8f5fb65e5c941a395d7a61d5ac0cd41cd98a788e20da89d084ec7f84f7a9f939',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`JSON upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
    }
  };

  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    
    if (!file) return;
    
    try {
      setIsUploading(true);
      setFeedback({ type: 'info', message: 'Preparing image for upload...' });
      
      // Store the file object for later use
      setFileObj(file);
      
      // Create a local preview URL
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      
      setFeedback({ type: 'success', message: 'Image ready for upload!' });
      
    } catch (error) {
      console.error("Image preparation error:", error);
      setFeedback({ type: 'error', message: `Error preparing image: ${error.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  const createNFT = async () => {
    const { name, description, price } = formData;
    
    if (!name || !description || !price || !fileObj) {
      setFeedback({ type: 'error', message: 'Please fill in all fields and upload an image' });
      return;
    }
    
    try {
      setIsCreating(true);
      setFeedback({ type: 'info', message: 'Starting NFT creation process...' });
      
      // Check if contracts are properly initialized
      if (!nft || !marketplace) {
        throw new Error('Contracts not properly initialized. Please reload the page and try again.');
      }

      // Step 1: Upload the image to IPFS
      setCurrentStep('Uploading image to IPFS');
      setFeedback({ type: 'info', message: 'Uploading image to IPFS...' });
      const imageUrl = await uploadFileToIPFS(fileObj);
      console.log('Image uploaded to IPFS:', imageUrl);
      
      // Step 2: Create and upload the metadata
      setCurrentStep('Preparing metadata');
      setFeedback({ type: 'info', message: 'Preparing metadata...' });
      const metadata = {
        name,
        description,
        image: imageUrl,
        created: new Date().toISOString()
      };
      
      const metadataUrl = await uploadJSONToIPFS(metadata);
      console.log('Metadata uploaded to IPFS:', metadataUrl);
      
      // Step 3: Get current gas price
      setCurrentStep('Preparing transaction');
      setFeedback({ type: 'info', message: 'Preparing blockchain transaction...' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      let gasPrice;
      try {
        gasPrice = await provider.getGasPrice();
        gasPrice = gasPrice.mul(120).div(100); // Add 20% buffer
        console.log(`Using gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
      } catch (error) {
        console.warn('Could not get gas price, using default');
        gasPrice = ethers.utils.parseUnits('20', 'gwei');
      }
      
      // Step 4: Try optimized mint first, fallback to regular mint
      setCurrentStep('Creating NFT');
      setFeedback({ type: 'info', message: 'Creating your NFT on the blockchain...' });
      
      let mintTx;
      let tokenId;
      
      try {
        // Try the optimized mintAndApprove function first
        console.log('Attempting optimized mint...');
        const gasEstimate = await nft.estimateGas.mintAndApprove(metadataUrl, marketplace.address);
        
        mintTx = await nft.mintAndApprove(metadataUrl, marketplace.address, {
          gasPrice,
          gasLimit: gasEstimate.mul(120).div(100)
        });
        
        setTransactionHash(mintTx.hash);
        setFeedback({ type: 'info', message: `Confirming transaction... (${mintTx.hash.slice(0, 8)}...)` });
        
        await mintTx.wait();
        tokenId = await nft.tokenCount();
        
        console.log('✅ Optimized mint successful, token ID:', tokenId.toString());
        
      } catch (optimizedError) {
        console.log('Optimized mint failed, trying standard mint:', optimizedError);
        
        // Fallback to standard mint + approve
        const gasEstimate = await nft.estimateGas.mint(metadataUrl);
        
        mintTx = await nft.mint(metadataUrl, {
          gasPrice,
          gasLimit: gasEstimate.mul(120).div(100)
        });
        
        setTransactionHash(mintTx.hash);
        setFeedback({ type: 'info', message: `Confirming mint transaction... (${mintTx.hash.slice(0, 8)}...)` });
        
        await mintTx.wait();
        tokenId = await nft.tokenCount();
        
        // Step 5: Approve marketplace
        setCurrentStep('Approving marketplace');
        setFeedback({ type: 'info', message: 'Approving marketplace...' });
        
        const approveTx = await nft.setApprovalForAll(marketplace.address, true, { gasPrice });
        setFeedback({ type: 'info', message: `Confirming approval... (${approveTx.hash.slice(0, 8)}...)` });
        await approveTx.wait();
        
        console.log('✅ Standard mint and approve successful, token ID:', tokenId.toString());
      }
      
      // Step 6: List on marketplace
      setCurrentStep('Listing on marketplace');
      setFeedback({ type: 'info', message: 'Listing on marketplace...' });
      
      const listingPrice = ethers.utils.parseEther(price.toString());
      const listTx = await marketplace.makeItem(nft.address, tokenId, listingPrice, { gasPrice });
      setFeedback({ type: 'info', message: `Confirming listing... (${listTx.hash.slice(0, 8)}...)` });
      await listTx.wait();
      
      setCurrentStep('Complete');
      setFeedback({ type: 'success', message: 'NFT created and listed successfully! Redirecting...' });
      
      console.log('✅ NFT creation complete!');
      
      // Reset form and redirect
      setTimeout(() => {
        setFormData({ name: '', description: '', price: '' });
        setImageUrl('');
        setFileObj(null);
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error("Error creating NFT:", error);
      
      let userFriendlyMessage = '';
      
      if (error.message.includes('user rejected transaction')) {
        userFriendlyMessage = 'Transaction was rejected in your wallet.';
      } else if (error.message.includes('insufficient funds')) {
        userFriendlyMessage = 'Insufficient funds for gas fee. Please add more ETH to your wallet.';
      } else if (error.message.includes('execution reverted')) {
        userFriendlyMessage = 'Transaction failed. This might be due to network congestion or contract issues.';
      } else if (error.message.includes('nonce')) {
        userFriendlyMessage = 'Transaction nonce issue. Try resetting your wallet connection.';
      } else if (error.message.includes('IPFS')) {
        userFriendlyMessage = `IPFS upload failed: ${error.message}`;
      } else {
        userFriendlyMessage = `Error creating NFT: ${error.message}`;
      }
      
      setFeedback({ 
        type: 'error', 
        message: userFriendlyMessage
      });
      
    } finally {
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
        </div>
        <p className="mt-6 text-xl text-text-secondary text-center max-w-md">
          {feedback.message || `Creating your NFT... (${currentStep})`}
        </p>
        {transactionHash && (
          <a 
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 text-primary underline"
          >
            View Transaction on Etherscan
          </a>
        )}
        <button 
          onClick={() => setIsCreating(false)} 
          className="mt-8 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-light transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto bg-surface rounded-2xl shadow-xl shadow-black/10 border border-border overflow-hidden">
          <div className="px-8 py-6 text-center border-b border-border bg-surface-light">
            <h1 className="text-3xl font-bold">Create New NFT</h1>
            <p className="text-text-secondary mt-2">
              Create your unique digital asset to sell on the marketplace
            </p>
          </div>
          
          {feedback.message && (
            <div className={`mx-8 mt-6 px-4 py-3 rounded-lg ${
              feedback.type === 'info' ? 'bg-primary/10 text-primary border border-primary/30' :
              feedback.type === 'success' ? 'bg-success/10 text-success border border-success/30' :
              'bg-danger/10 text-danger border border-danger/30'
            }`}>
              {feedback.message}
            </div>
          )}
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center">
              {imageUrl ? (
                <div className="w-full max-w-md h-[300px] rounded-xl overflow-hidden border border-border mb-6">
                  <img src={imageUrl} alt="NFT Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full max-w-md h-[300px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center mb-6 bg-surface-light">
                  <FaImage className="text-5xl text-text-secondary/50 mb-4" />
                  <p className="text-text-secondary">Your NFT will appear here</p>
                </div>
              )}
              
              <label className={`w-full max-w-md flex items-center justify-center gap-2 py-3 px-4 ${
                isUploading ? 'bg-primary/80 cursor-wait' : 'bg-primary hover:bg-primary/90 hover:-translate-y-1'
              } text-white rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/20`}>
                <input
                  type="file"
                  className="hidden"
                  onChange={uploadToIPFS}
                  disabled={isUploading}
                  accept="image/*"
                />
                <FaCloudUploadAlt className="text-xl" />
                <span>
                  {isUploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image'}
                </span>
              </label>
              
              <div className="mt-4 w-full max-w-md text-sm text-text-secondary">
                <div className="flex items-start mb-2">
                  <FaExclamationTriangle className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                  <p>Upload images under 10MB for best results. JPG, PNG, GIF supported.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-text font-medium mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter NFT name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-surface-light text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-text font-medium mb-2">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Describe your NFT"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-surface-light text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200 resize-y"
                  required
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-text font-medium mb-2">Price (ETH)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEthereum className="text-primary" />
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    id="price"
                    name="price"
                    placeholder="0.001"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface-light text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200"
                    required
                  />
                </div>
              </div>
              
              <button 
                onClick={createNFT}
                disabled={isUploading || !fileObj || !formData.name || !formData.description || !formData.price}
                className={`w-full mt-4 py-4 px-6 rounded-lg font-semibold text-white ${
                  isUploading || !fileObj || !formData.name || !formData.description || !formData.price
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20'
                } transition-all duration-200`}
              >
                Create & List NFT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;