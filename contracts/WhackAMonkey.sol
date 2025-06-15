// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WhackAMonkey is Ownable, ReentrancyGuard {
    // Game constants
    uint256 public constant GAME_COST = 2 ether; // 2 APE
    uint256 public constant PROTOCOL_FEE = 0.5 ether; // 0.5 APE
    uint256 public constant PRIZE_POOL_PERCENTAGE = 75; // 75% of remaining funds

    // Game state
    uint256 public currentHighScore;
    uint256 public prizePool;
    uint256 public protocolFees;

    // Events
    event GamePlayed(address indexed player, uint256 score);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event ProtocolFeesWithdrawn(uint256 amount);
    event PrizePoolFunded(uint256 amount);

    // Struct to store game results
    struct GameResult {
        address player;
        uint256 score;
        uint256 timestamp;
        uint256 prizeAmount;
    }

    // Array to store recent game results
    GameResult[] public recentResults;
    uint256 public constant MAX_RECENT_RESULTS = 10;

    constructor() Ownable(msg.sender) {}

    // Function to play the game
    function playGame() external payable nonReentrant {
        require(msg.value == GAME_COST, "Incorrect game cost");
        
        // Split the payment
        protocolFees += PROTOCOL_FEE;
        prizePool += (GAME_COST - PROTOCOL_FEE);

        // Emit event for game played
        emit GamePlayed(msg.sender, 0); // Score will be updated by frontend
    }

    // Function to claim prize
    function claimPrize(uint256 score) external nonReentrant {
        require(score >= currentHighScore, "Score too low");
        
        uint256 prizeAmount = (prizePool * PRIZE_POOL_PERCENTAGE) / 100;
        require(prizeAmount > 0, "No prize available");

        // Update high score and prize pool
        currentHighScore = score;
        prizePool -= prizeAmount;

        // Add to recent results
        if (recentResults.length >= MAX_RECENT_RESULTS) {
            // Remove oldest result
            for (uint i = 0; i < recentResults.length - 1; i++) {
                recentResults[i] = recentResults[i + 1];
            }
            recentResults.pop();
        }
        recentResults.push(GameResult({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            prizeAmount: prizeAmount
        }));

        // Transfer prize
        (bool success, ) = msg.sender.call{value: prizeAmount}("");
        require(success, "Prize transfer failed");

        emit PrizeClaimed(msg.sender, prizeAmount);
    }

    // Function to withdraw protocol fees (owner only)
    function withdrawProtocolFees() external onlyOwner {
        uint256 amount = protocolFees;
        protocolFees = 0;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit ProtocolFeesWithdrawn(amount);
    }

    // Function to fund prize pool (owner only)
    function fundPrizePool() external payable onlyOwner {
        require(msg.value > 0, "Must send some APE");
        prizePool += msg.value;
        emit PrizePoolFunded(msg.value);
    }

    // Function to get recent results
    function getRecentResults() external view returns (GameResult[] memory) {
        return recentResults;
    }

    // Function to get current prize pool amount
    function getPrizePoolAmount() external view returns (uint256) {
        return (prizePool * PRIZE_POOL_PERCENTAGE) / 100;
    }

    // Function to get protocol fees
    function getProtocolFees() external view returns (uint256) {
        return protocolFees;
    }

    // Emergency withdrawal function (owner only)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // Receive function to accept ETH
    receive() external payable {}
} 