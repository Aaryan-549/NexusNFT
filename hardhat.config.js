// Updated hardhat.config.js with your Infura endpoint
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// This is a sample Hardhat task
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts"
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      // Use your specific Infura endpoint from your .env file
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/54c61c32e3544369b2aaa0290f8551ee",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000, // 1 minute timeout
      gasPrice: 50000000000, // 50 gwei - increase if needed
      gas: 5000000 // gas limit
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};