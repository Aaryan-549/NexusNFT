// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BatchProcessor
 * @dev Handles batched transactions for the marketplace to reduce gas costs
 */
contract BatchProcessor {
    using ECDSA for bytes32;
    
    address public operator;
    bytes32 public stateRoot; // Merkle root of the current state
    uint256 public batchNonce;
    
    mapping(address => uint256) public lastProcessedBatch;
    
    event BatchProcessed(uint256 batchId, bytes32 newStateRoot);
    
    constructor() {
        operator = msg.sender;
    }
    
    modifier onlyOperator() {
        require(msg.sender == operator, "BatchProcessor: caller is not the operator");
        _;
    }
    
    // Process a batch of transactions and update the state root
    function processBatch(bytes32 _newStateRoot, bytes calldata _signature) external onlyOperator {
        // Verify the signature - in a real zk-rollup this would verify a ZK proof
        bytes32 messageHash = keccak256(abi.encodePacked(batchNonce, _newStateRoot));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(_signature);
        
        require(signer == operator, "BatchProcessor: invalid signature");
        
        stateRoot = _newStateRoot;
        batchNonce++;
        
        emit BatchProcessed(batchNonce, _newStateRoot);
    }
    
    // Verify that a transaction is included in the current state
    function verifyInclusion(bytes32[] calldata _proof, bytes32 _leaf) external view returns (bool) {
        return verifyMerkle(_proof, stateRoot, _leaf);
    }
    
    // Internal function to verify Merkle proofs
    function verifyMerkle(bytes32[] calldata _proof, bytes32 _root, bytes32 _leaf) internal pure returns (bool) {
        bytes32 computedHash = _leaf;

        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == _root;
    }
}