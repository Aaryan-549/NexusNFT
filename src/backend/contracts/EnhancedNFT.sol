// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title Enhanced NFT Contract
 * @dev NFT contract with batch minting capabilities
 */
contract EnhancedNFT is ERC721URIStorage {
    uint public tokenCount;
    address public operator;
    
    struct BatchMintItem {
        address recipient;
        string tokenURI;
    }
    
    event BatchMinted(uint256 fromTokenId, uint256 toTokenId);
    
    constructor() ERC721("NEXUS NFT", "NEXUS") {
        operator = msg.sender;
    }
    
    modifier onlyOperator() {
        require(msg.sender == operator, "EnhancedNFT: caller is not the operator");
        _;
    }
    
    function mint(string memory _tokenURI) external returns(uint) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return(tokenCount);
    }
    
    // Optimized mint and approve in one transaction
    function mintAndApprove(string memory _tokenURI, address marketplaceAddress) external returns(uint) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        
        // Approve the marketplace in the same transaction
        setApprovalForAll(marketplaceAddress, true);
        
        return(tokenCount);
    }
    
    // Batch mint multiple NFTs in a single transaction
    function batchMint(BatchMintItem[] calldata _items) external onlyOperator returns (uint256[] memory) {
        uint256 startTokenId = tokenCount + 1;
        uint256[] memory mintedIds = new uint256[](_items.length);
        
        for (uint256 i = 0; i < _items.length; i++) {
            tokenCount++;
            _safeMint(_items[i].recipient, tokenCount);
            _setTokenURI(tokenCount, _items[i].tokenURI);
            mintedIds[i] = tokenCount;
        }
        
        emit BatchMinted(startTokenId, tokenCount);
        
        return mintedIds;
    }
    
    // Allow the operator to be changed
    function setOperator(address _newOperator) external onlyOperator {
        operator = _newOperator;
    }
}