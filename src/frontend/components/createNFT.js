// createNFT.js - Updated to use proxy server

import { ethers } from "ethers";

// Configuration - adjust these URLs to match your setup
const PROXY_BASE_URL = 'http://localhost:5000'; // Your proxy server URL
const USE_PROXY = true; // Set to false to try direct Pinata calls

/**
 * Upload file to IPFS via proxy server
 */
const uploadFileToIPFS = async (file) => {
  if (USE_PROXY) {
    // Upload via proxy server
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${PROXY_BASE_URL}/api/pinata/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Proxy file upload failed: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } else {
    // Direct Pinata upload (will likely fail due to CORS)
    const formData = new FormData();
    formData.append('file', file);
    
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
        'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`IPFS file upload failed: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  }
};

/**
 * Upload JSON to IPFS via proxy server
 */
const uploadJSONToIPFS = async (jsonData) => {
  if (USE_PROXY) {
    // Upload via proxy server
    const response = await fetch(`${PROXY_BASE_URL}/api/pinata/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Proxy JSON upload failed: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } else {
    // Direct Pinata upload (will likely fail due to CORS)
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY,
        'pinata_secret_api_key': process.env.REACT_APP_PINATA_SECRET_KEY,
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`IPFS JSON upload failed: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  }
};

/**
 * Creates and lists an NFT in the marketplace with proper error handling
 */
export const createNFT = async ({
  nft,
  marketplace,
  name,
  description,
  file,
  price,
  onStatus = () => {},
  onError = () => {},
  onSuccess = () => {}
}) => {
  let mintTxHash = null;
  let listTxHash = null;
  
  try {
    // 1. Validate inputs
    if (!nft || !marketplace) {
      throw new Error("Contract instances not initialized");
    }
    
    if (!name || !description || !file || !price) {
      throw new Error("Missing required fields");
    }

    // 2. Test proxy connection if using proxy
    if (USE_PROXY) {
      onStatus({ step: 'proxy-test', message: 'Testing proxy connection...' });
      
      try {
        const testResponse = await fetch(`${PROXY_BASE_URL}/api/pinata/test`);
        if (!testResponse.ok) {
          throw new Error('Proxy server not responding');
        }
        const testResult = await testResponse.json();
        
        if (!testResult.success) {
          throw new Error(`Proxy authentication failed: ${testResult.error}`);
        }
        
        console.log('✅ Proxy connection successful');
      } catch (proxyError) {
        throw new Error(`Proxy connection failed: ${proxyError.message}. Make sure your proxy server is running on ${PROXY_BASE_URL}`);
      }
    }
    
    // 3. Upload image to IPFS
    onStatus({ step: 'ipfs-image', message: 'Uploading image to IPFS...' });
    
    console.log('Uploading image:', file.name, file.size, 'bytes');
    
    const imageData = await uploadFileToIPFS(file);
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageData.IpfsHash}`;
    
    console.log('✅ Image uploaded successfully:', imageUrl);
    
    // 4. Create and upload metadata
    onStatus({ step: 'ipfs-metadata', message: 'Creating metadata...' });
    
    const metadata = {
      name,
      description,
      image: imageUrl,
      created: new Date().toISOString()
    };
    
    console.log('Uploading metadata:', metadata);
    
    const metadataData = await uploadJSONToIPFS(metadata);
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataData.IpfsHash}`;
    
    console.log('✅ Metadata uploaded successfully:', metadataUrl);
    
    // 5. Prepare transaction options
    onStatus({ step: 'prepare-transaction', message: 'Preparing transaction...' });
    
    let gasPrice;
    try {
      const provider = nft.provider;
      const currentGasPrice = await provider.getGasPrice();
      gasPrice = currentGasPrice.mul(150).div(100); // Add 50% buffer
      console.log(`Using gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    } catch (error) {
      console.warn('Failed to get gas price, using fallback');
      gasPrice = ethers.utils.parseUnits('20', 'gwei');
    }
    
    // 6. Check for optimized mint function
    let hasOptimizedMint = false;
    try {
      hasOptimizedMint = typeof nft.mintAndApprove === 'function';
    } catch (e) {
      console.log('No optimized mint function available');
    }
    
    let tokenId;
    
    console.log('=== MINTING NFT ===');
    console.log('Metadata URL:', metadataUrl);
    console.log('Using optimized mint:', hasOptimizedMint);
    
    if (hasOptimizedMint) {
      // Use the optimized function if available
      onStatus({ step: 'mint', message: 'Creating NFT (optimized)...' });
      
      try {
        const gasEstimate = await nft.estimateGas.mintAndApprove(metadataUrl, marketplace.address);
        
        const txOptions = {
          gasPrice,
          gasLimit: gasEstimate.mul(120).div(100)
        };
        
        const mintTx = await nft.mintAndApprove(metadataUrl, marketplace.address, txOptions);
        mintTxHash = mintTx.hash;
        
        onStatus({ 
          step: 'mint-confirmation', 
          message: 'Confirming transaction...', 
          hash: mintTx.hash 
        });
        
        await mintTx.wait();
        tokenId = await nft.tokenCount();
        
      } catch (mintError) {
        console.error('Optimized mint failed:', mintError);
        throw mintError;
      }
      
    } else {
      // Standard mint process
      onStatus({ step: 'mint', message: 'Creating NFT...' });
      
      try {
        const gasEstimate = await nft.estimateGas.mint(metadataUrl);
        
        const txOptions = {
          gasPrice,
          gasLimit: gasEstimate.mul(120).div(100)
        };
        
        const mintTx = await nft.mint(metadataUrl, txOptions);
        mintTxHash = mintTx.hash;
        
        onStatus({ 
          step: 'mint-confirmation', 
          message: 'Confirming mint transaction...', 
          hash: mintTx.hash 
        });
        
        await mintTx.wait();
        tokenId = await nft.tokenCount();
        
        // Approve marketplace
        onStatus({ step: 'approve', message: 'Approving marketplace...' });
        
        const approveTx = await nft.setApprovalForAll(marketplace.address, true, { gasPrice });
        await approveTx.wait();
        
      } catch (mintError) {
        console.error('Standard mint failed:', mintError);
        throw mintError;
      }
    }
    
    console.log('✅ NFT minted with token ID:', tokenId.toString());
    
    // 7. List on marketplace
    onStatus({ step: 'list', message: 'Listing on marketplace...' });
    
    const listingPrice = ethers.utils.parseEther(price.toString());
    const listTx = await marketplace.makeItem(nft.address, tokenId, listingPrice, { gasPrice });
    listTxHash = listTx.hash;
    
    onStatus({ 
      step: 'list-confirmation', 
      message: 'Confirming listing transaction...', 
      hash: listTx.hash 
    });
    
    await listTx.wait();
    
    console.log('✅ NFT listed successfully');
    
    // 8. Success!
    onStatus({ 
      step: 'complete', 
      message: 'Success! Your NFT has been created and listed.', 
      tokenId,
      mintTxHash,
      listTxHash
    });
    
    onSuccess({
      tokenId,
      mintTxHash,
      listTxHash,
      imageUrl,
      metadataUrl
    });
    
    return {
      success: true,
      tokenId,
      mintTxHash,
      listTxHash,
      imageUrl,
      metadataUrl
    };
    
  } catch (error) {
    console.error('NFT creation error:', error);
    
    // Handle specific error types
    if (error.code === 4001 || error.message.includes('user rejected transaction')) {
      onError({
        message: 'Transaction was rejected in your wallet.',
        mintTxHash,
        listTxHash
      });
      return { success: false, error: 'Transaction rejected' };
    }
    
    if (error.message.includes('out of gas') || error.message.includes('insufficient funds')) {
      onError({
        message: 'Transaction failed due to gas issues. Try increasing your gas limit or adding more funds to your wallet.',
        mintTxHash,
        listTxHash
      });
      return { success: false, error: 'Gas error' };
    }
    
    if (error.message.includes('Proxy connection failed')) {
      onError({
        message: 'Cannot connect to upload server. Please make sure the proxy server is running.',
        details: error.message,
        mintTxHash,
        listTxHash
      });
      return { success: false, error: 'Proxy error' };
    }
    
    onError({
      message: `Error: ${error.message}`,
      details: error.toString(),
      mintTxHash,
      listTxHash
    });
    
    return { 
      success: false, 
      error: error.message,
      mintTxHash,
      listTxHash
    };
  }
};

export default createNFT;