// src/utils/ipfsUtils.js - Improved version with proper error handling

/**
 * Utility functions for interacting with IPFS via Pinata
 * with improved error handling and better environment variable usage
 */

// Upload a file to IPFS using Pinata
export const uploadFileToIPFS = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Create pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    // Get API keys from environment variables
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('Pinata API keys are not configured. Please check your environment variables.');
    }

    // Add some timeout handling to prevent indefinite waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

    const response = await fetch(process.env.NEXT_PUBLIC_PINATA_POST_URL || 'https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Pinata error response:', errorData);
      throw new Error(`Error uploading file to IPFS: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Validate that we got an IPFS hash back
    if (!result.IpfsHash) {
      throw new Error('Invalid response from IPFS: No hash returned');
    }
    
    return `${process.env.NEXT_PUBLIC_PINATA_HASH_URL || 'https://gateway.pinata.cloud/ipfs/'}${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    
    // Provide more helpful error messages based on error type
    if (error.name === 'AbortError') {
      throw new Error('IPFS upload timed out. The Pinata service might be experiencing issues or your file may be too large.');
    } else if (error.message.includes('NetworkError')) {
      throw new Error('Network error when connecting to IPFS. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

// Upload JSON metadata to IPFS using Pinata
export const uploadJSONToIPFS = async (metadata) => {
  try {
    // Get API keys from environment variables
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRECT_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('Pinata API keys are not configured. Please check your environment variables.');
    }

    // Add some timeout handling to prevent indefinite waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    const response = await fetch(process.env.NEXT_PUBLIC_PINATA_POST_JSON_URL || 'https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify(metadata),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Pinata error response:', errorData);
      throw new Error(`Error uploading JSON to IPFS: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Validate that we got an IPFS hash back
    if (!result.IpfsHash) {
      throw new Error('Invalid response from IPFS: No hash returned');
    }
    
    return `${process.env.NEXT_PUBLIC_PINATA_HASH_URL || 'https://gateway.pinata.cloud/ipfs/'}${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    
    // Provide more helpful error messages based on error type
    if (error.name === 'AbortError') {
      throw new Error('IPFS upload timed out. The Pinata service might be experiencing issues.');
    } else if (error.message.includes('NetworkError')) {
      throw new Error('Network error when connecting to IPFS. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

// Create and upload NFT metadata to IPFS with improved error handling
export const createNFTMetadata = async (name, description, imageFile) => {
  try {
    // First upload the image
    const imageUrl = await uploadFileToIPFS(imageFile);
    
    // Create the metadata
    const metadata = {
      name,
      description,
      image: imageUrl,
      // Adding a timestamp helps ensure unique content
      created: new Date().toISOString()
    };
    
    // Upload the metadata to IPFS
    const metadataUrl = await uploadJSONToIPFS(metadata);
    
    return {
      success: true,
      metadataUrl,
      metadata
    };
  } catch (error) {
    console.error('Error creating NFT metadata:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to prepare batch mint data
export const prepareBatchMintData = async (items) => {
  try {
    // For each item, upload image and create metadata
    const batchData = await Promise.all(items.map(async (item) => {
      const { name, description, image, recipient } = item;
      
      // Upload the item's metadata
      const result = await createNFTMetadata(name, description, image);
      
      if (!result.success) {
        throw new Error(`Failed to create metadata for ${name}: ${result.error}`);
      }
      
      return {
        recipient,
        tokenURI: result.metadataUrl,
      };
    }));
    
    return batchData;
  } catch (error) {
    console.error('Error preparing batch mint data:', error);
    throw error;
  }
};

// Helper function to validate IPFS gateway and test connection
export const validateIPFSConnection = async () => {
  try {
    // Test the IPFS gateway connection
    const response = await fetch('https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme', {
      method: 'HEAD',
      // Short timeout to quickly determine if gateway is responsive
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'IPFS gateway is accessible' : `IPFS gateway returned status: ${response.status}`
    };
  } catch (error) {
    console.error('Error validating IPFS connection:', error);
    return {
      success: false,
      message: `Cannot connect to IPFS gateway: ${error.message}`
    };
  }
};