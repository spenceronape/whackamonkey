// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract WhackAMonkey is Ownable, ReentrancyGuard, AccessControl {
    // Configurable state variables (previously constants)
    uint256 public gameCost = 2.5 ether; // 2.5 $APE (native token) - now configurable
    uint256 public protocolFee = 0.5 ether; // 0.5 $APE - now configurable
    uint256 public prizePoolShare = 75e16; // 0.75 * 1e18 - now configurable
    
    // Constants
    uint256 public constant DEFAULT_MIN_BUFFER = 2 ether; // 2 $APE

    // Role definitions
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // State variables
    uint256 public prizePool;
    uint256 public protocolFees;
    uint256 public highScore;
    address public highScoreHolder;
    uint256 public highScoreTimestamp;
    bool public gameActive;
    uint256 public scoreToBeat; // Minimum score needed to win
    address public trustedSigner;
    mapping(address => uint256) public lastScoreNonce;
    uint256 public minPrizePoolBuffer = DEFAULT_MIN_BUFFER;
    bool public paused = false;
    mapping(address => uint256) public playerHighScores;

    // Events
    event GameStarted(address indexed player, uint256 timestamp);
    event PrizeClaimed(address indexed winner, uint256 amount, uint256 score);
    event HighScoreUpdated(
        address indexed player,
        uint256 newHighScore,
        uint256 previousHighScore,
        address previousHolder,
        uint256 timestamp
    );
    event ProtocolFeeWithdrawn(address indexed owner, uint256 amount);
    event EmergencyWithdrawn(address indexed owner, uint256 amount);
    event PrizePoolFunded(uint256 amount);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event ScoreToBeatUpdated(uint256 newScoreToBeat);
    event MinPrizePoolBufferUpdated(uint256 newBuffer);
    event Paused();
    event Unpaused();
    event Rescue(address indexed token, uint256 amount, address indexed to);
    event GameCostUpdated(uint256 newGameCost);
    event ProtocolFeeUpdated(uint256 newProtocolFee);
    event PrizePoolShareUpdated(uint256 newPrizePoolShare);

    // Modifiers
    modifier whenGameActive() {
        require(gameActive, "Game is not active");
        _;
    }
    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not an operator");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "Game is paused");
        _;
    }

    constructor() Ownable(msg.sender) {
        gameActive = true;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        scoreToBeat = 50; // Initial score to beat
    }

    // Game entry: pay to play
    function startGame() external payable whenGameActive whenNotPaused nonReentrant {
        require(msg.value == gameCost, "Incorrect payment");
        // Prize pool gets gameCost - protocolFee, protocol fees get protocolFee
        prizePool += (gameCost - protocolFee);
        protocolFees += protocolFee;
        emit GameStarted(msg.sender, block.timestamp);
    }

    // Submit score with backend signature
    function submitScore(
        uint256 score,
        uint256 nonce,
        bytes calldata signature
    ) external whenGameActive whenNotPaused nonReentrant {
        require(nonce > lastScoreNonce[msg.sender], "Old nonce");
        lastScoreNonce[msg.sender] = nonce;

        bytes32 hash = keccak256(abi.encodePacked(msg.sender, score, nonce));
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        address signer = ECDSA.recover(message, signature);
        require(signer == trustedSigner, "Invalid signature");

        // Only update high score if it beats the current one
        if (score > highScore) {
            uint256 previousHighScore = highScore;
            address previousHolder = highScoreHolder;
            highScore = score;
            highScoreHolder = msg.sender;
            highScoreTimestamp = block.timestamp;
            emit HighScoreUpdated(
                msg.sender,
                score,
                previousHighScore,
                previousHolder,
                block.timestamp
            );
        }

        // Update player's personal high score
        if (score > playerHighScores[msg.sender]) {
            playerHighScores[msg.sender] = score;
        }

        // If score beats the threshold, allow claiming prize
        if (score >= scoreToBeat) {
            uint256 prizeAmount = (prizePool * prizePoolShare) / 1 ether;
            require(prizePool - prizeAmount >= minPrizePoolBuffer, "Prize pool buffer too low");
            require(address(this).balance >= prizeAmount + protocolFees, "Insufficient contract balance");
            prizePool -= prizeAmount;
            (payable(msg.sender)).transfer(prizeAmount);
            emit PrizeClaimed(msg.sender, prizeAmount, score);
        }
    }

    // Owner functions
    function setGameActive(bool _active) external onlyOwner {
        gameActive = _active;
    }
    function withdrawProtocolFees() external onlyOperator {
        require(protocolFees > 0, "No fees to withdraw");
        uint256 amount = protocolFees;
        protocolFees = 0;
        (payable(msg.sender)).transfer(amount);
        emit ProtocolFeeWithdrawn(msg.sender, amount);
    }
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (payable(owner())).transfer(balance);
        emit EmergencyWithdrawn(owner(), balance);
    }
    function fundPrizePool() external payable onlyOwner {
        require(msg.value > 0, "Amount must be greater than 0");
        prizePool += msg.value;
        emit PrizePoolFunded(msg.value);
    }
    function addOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        grantRole(OPERATOR_ROLE, operator);
        emit OperatorAdded(operator);
    }
    function removeOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        revokeRole(OPERATOR_ROLE, operator);
        emit OperatorRemoved(operator);
    }
    function setScoreToBeat(uint256 newScore) external onlyOperator {
        require(newScore > 0, "Score must be greater than 0");
        scoreToBeat = newScore;
        emit ScoreToBeatUpdated(newScore);
    }
    function setTrustedSigner(address _signer) external onlyOwner {
        trustedSigner = _signer;
    }
    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }
    function setMinPrizePoolBuffer(uint256 newBuffer) external onlyOwner {
        minPrizePoolBuffer = newBuffer;
        emit MinPrizePoolBufferUpdated(newBuffer);
    }
    function setGameCost(uint256 newGameCost) external onlyOperator {
        require(newGameCost > 0, "Game cost must be greater than 0");
        require(newGameCost >= protocolFee, "Game cost must be >= protocol fee");
        gameCost = newGameCost;
        emit GameCostUpdated(newGameCost);
    }
    function setProtocolFee(uint256 newProtocolFee) external onlyOperator {
        require(newProtocolFee > 0, "Protocol fee must be greater than 0");
        require(newProtocolFee <= gameCost, "Protocol fee cannot exceed game cost");
        protocolFee = newProtocolFee;
        emit ProtocolFeeUpdated(newProtocolFee);
    }
    function setPrizePoolShare(uint256 newPrizePoolShare) external onlyOperator {
        require(newPrizePoolShare > 0, "Prize pool share must be greater than 0");
        require(newPrizePoolShare <= 1 ether, "Prize pool share cannot exceed 100%");
        prizePoolShare = newPrizePoolShare;
        emit PrizePoolShareUpdated(newPrizePoolShare);
    }
    // Rescue any ERC20 tokens sent to this contract by mistake
    function rescueTokens(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(0), "Invalid token address");
        (bool success, ) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(success, "Rescue failed");
        emit Rescue(token, amount, to);
    }
    // View functions
    function isOperator(address account) external view returns (bool) {
        return hasRole(OPERATOR_ROLE, account);
    }
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }
    function getProtocolFees() external view returns (uint256) {
        return protocolFees;
    }
    function getCurrentBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 