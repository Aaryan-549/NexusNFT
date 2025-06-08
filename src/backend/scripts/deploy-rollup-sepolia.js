// scripts/deploy-rollup-sepolia.js - Corrected for your file structure
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying rollup-enhanced marketplace contracts to Sepolia...");
  
  // Get the deployer's address with proper error handling
  let deployer;
  try {
    const signers = await ethers.getSigners();
    
    if (!signers || signers.length === 0) {
      throw new Error("No signers available. Make sure your PRIVATE_KEY is correctly set in your .env file.");
    }
    
    deployer = signers[0];
    console.log("Deploying contracts with the account:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Check if balance is sufficient
    if (balance.lt(ethers.utils.parseEther("0.01"))) {
      console.warn("WARNING: Account balance is very low. You may not have enough ETH to deploy contracts.");
    }
  } catch (error) {
    console.error("Error getting deployer account:", error.message);
    console.error("\nPlease check your .env file and make sure your PRIVATE_KEY is correctly set.");
    process.exit(1);
  }

  try {
    // Deploy BatchProcessor first
    console.log("Deploying BatchProcessor...");
    const BatchProcessor = await ethers.getContractFactory("BatchProcessor");
    const batchProcessor = await BatchProcessor.deploy();
    await batchProcessor.deployed();
    console.log("BatchProcessor deployed to:", batchProcessor.address);

    // Deploy MarketplaceWithRollup with a 2.5% fee
    console.log("Deploying MarketplaceWithRollup...");
    const feePercent = 25; // 2.5%
    const MarketplaceWithRollup = await ethers.getContractFactory("MarketplaceWithRollup");
    const marketplace = await MarketplaceWithRollup.deploy(feePercent, batchProcessor.address);
    await marketplace.deployed();
    console.log("MarketplaceWithRollup deployed to:", marketplace.address);

    // Deploy EnhancedNFT
    console.log("Deploying EnhancedNFT...");
    const EnhancedNFT = await ethers.getContractFactory("EnhancedNFT");
    const nft = await EnhancedNFT.deploy();
    await nft.deployed();
    console.log("EnhancedNFT deployed to:", nft.address);

    // Save contract addresses and ABIs for the frontend
    saveContractData(marketplace.address, nft.address, batchProcessor.address);

    console.log("Deployment complete!");
    console.log("----------------------------------------------------");
    console.log("Contract Addresses:");
    console.log("Marketplace:", marketplace.address);
    console.log("NFT:", nft.address);
    console.log("BatchProcessor:", batchProcessor.address);
    console.log("----------------------------------------------------");
    console.log("Verify contracts on Sepolia Etherscan with:");
    console.log(`npx hardhat verify --network sepolia ${batchProcessor.address}`);
    console.log(`npx hardhat verify --network sepolia ${marketplace.address} ${feePercent} ${batchProcessor.address}`);
    console.log(`npx hardhat verify --network sepolia ${nft.address}`);
  } catch (error) {
    console.error("Error during deployment:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\nYou don't have enough ETH in your account to deploy these contracts.");
      console.error("Get some Sepolia ETH from a faucet: https://sepoliafaucet.com/");
    } else if (error.message.includes("nonce")) {
      console.error("\nNonce error. Your account might have pending transactions.");
      console.error("Try resetting your account nonce in MetaMask or wait for pending transactions to complete.");
    }
  }
}

function saveContractData(marketplaceAddress, nftAddress, batchProcessorAddress) {
  try {
    // For your current structure, save to src/frontend/contractsData
    const contractsDir = path.join(__dirname, '..', 'src', 'frontend', 'contractsData');
    
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    console.log("Saving contract data to:", contractsDir);

    // Save addresses
    fs.writeFileSync(
      path.join(contractsDir, "MarketplaceWithRollup-address.json"),
      JSON.stringify({ address: marketplaceAddress }, undefined, 2)
    );

    fs.writeFileSync(
      path.join(contractsDir, "EnhancedNFT-address.json"),
      JSON.stringify({ address: nftAddress }, undefined, 2)
    );

    fs.writeFileSync(
      path.join(contractsDir, "BatchProcessor-address.json"),
      JSON.stringify({ address: batchProcessorAddress }, undefined, 2)
    );

    // Save ABIs from artifacts - adjusted paths for your structure
    try {
      const artifactsPath = path.join(__dirname, '..', 'artifacts', 'src', 'backend', 'contracts');
      
      // BatchProcessor
      const batchProcessorArtifactPath = path.join(artifactsPath, 'BatchProcessor.sol', 'BatchProcessor.json');
      if (fs.existsSync(batchProcessorArtifactPath)) {
        const batchProcessorArtifact = JSON.parse(fs.readFileSync(batchProcessorArtifactPath, 'utf8'));
        fs.writeFileSync(
          path.join(contractsDir, "BatchProcessor.json"),
          JSON.stringify(batchProcessorArtifact, null, 2)
        );
      }
      
      // MarketplaceWithRollup
      const marketplaceArtifactPath = path.join(artifactsPath, 'MarketplaceWithRollup.sol', 'MarketplaceWithRollup.json');
      if (fs.existsSync(marketplaceArtifactPath)) {
        const marketplaceArtifact = JSON.parse(fs.readFileSync(marketplaceArtifactPath, 'utf8'));
        fs.writeFileSync(
          path.join(contractsDir, "MarketplaceWithRollup.json"),
          JSON.stringify(marketplaceArtifact, null, 2)
        );
      }
      
      // EnhancedNFT
      const nftArtifactPath = path.join(artifactsPath, 'EnhancedNFT.sol', 'EnhancedNFT.json');
      if (fs.existsSync(nftArtifactPath)) {
        const nftArtifact = JSON.parse(fs.readFileSync(nftArtifactPath, 'utf8'));
        fs.writeFileSync(
          path.join(contractsDir, "EnhancedNFT.json"),
          JSON.stringify(nftArtifact, null, 2)
        );
      }
      
      console.log("Contract ABIs saved successfully.");
    } catch (error) {
      console.error("Error copying artifacts:", error.message);
      console.log("You may need to manually copy the ABI files after deployment.");
    }
  } catch (error) {
    console.error("Error saving contract data:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });