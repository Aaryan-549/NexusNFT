// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MarketplaceWithRollup
 * @dev Enhanced marketplace contract with batched processing capabilities
 */
contract MarketplaceWithRollup is ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Variables
    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;
    address public batchProcessor;
    
    // For offchain transactions
    mapping(bytes32 => bool) public processedTransactions;
    
    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }
    
    // itemId -> Item
    mapping(uint => Item) public items;
    
    // Users' deposits for batched transactions
    mapping(address => uint256) public deposits;
    
    event Offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );
    
    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event BatchedPurchase(bytes32 transactionHash);
    
    constructor(uint _feePercent, address _batchProcessorAddress) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
        batchProcessor = _batchProcessorAddress;
    }

    // Make item to offer on the marketplace
    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        // increment itemCount
        itemCount++;
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to items mapping
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );
        // emit Offered event
        emit Offered(
            itemCount,
            address(_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }
    
    // Regular on-chain purchase function
    function purchaseItem(uint _itemId) external payable nonReentrant {
        uint _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(!item.sold, "item already sold");
        
        // pay seller and feeAccount
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);
        
        // update item to sold
        item.sold = true;
        
        // transfer nft to buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        
        // emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }
    
    // Deposit funds for batched transactions
    function deposit() external payable {
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    // Withdraw funds
    function withdraw(uint256 _amount) external nonReentrant {
        require(deposits[msg.sender] >= _amount, "insufficient funds");
        
        deposits[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        
        emit Withdrawn(msg.sender, _amount);
    }
    
    // Submit multiple purchases in a single transaction (gas optimization)
    function batchPurchaseItems(uint[] calldata _itemIds) external payable nonReentrant {
        uint totalCost = 0;
        
        // Calculate total cost
        for (uint i = 0; i < _itemIds.length; i++) {
            uint itemId = _itemIds[i];
            require(itemId > 0 && itemId <= itemCount, "item doesn't exist");
            require(!items[itemId].sold, "item already sold");
            
            totalCost += getTotalPrice(itemId);
        }
        
        require(msg.value >= totalCost, "not enough ether to cover all items");
        
        // Process each purchase
        for (uint i = 0; i < _itemIds.length; i++) {
            uint itemId = _itemIds[i];
            Item storage item = items[itemId];
            
            // Pay seller
            item.seller.transfer(item.price);
            
            // Update state
            item.sold = true;
            
            // Transfer NFT
            item.nft.transferFrom(address(this), msg.sender, item.tokenId);
            
            // Emit event
            emit Bought(
                itemId,
                address(item.nft),
                item.tokenId,
                item.price,
                item.seller,
                msg.sender
            );
        }
        
        // Pay fee account the total fees
        uint totalFee = totalCost - (msg.value - totalCost);
        if (totalFee > 0) {
            feeAccount.transfer(totalFee);
        }
        
        // Refund excess payment if any
        uint refund = msg.value - totalCost;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }
    
    function getTotalPrice(uint _itemId) view public returns(uint) {
        return((items[_itemId].price * (100 + feePercent)) / 100);
    }
}