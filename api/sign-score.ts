import { Wallet, ethers } from 'ethers';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new Wallet(PRIVATE_KEY!);

// Contract configuration
const CONTRACT_ADDRESS = '0x8095575cad6ee0bbf3bfe64eded03c44021507c2';
const RPC_URL = 'https://rpc.apechain.com/http';

// Contract ABI - just the function we need
const CONTRACT_ABI = [
  "function lastScoreNonce(address player) external view returns (uint256)"
];

// Maximum allowed score to prevent cheating
const MAX_SCORE = 2000;
// Minimum time between submissions (in seconds) - reduced for better UX
const MIN_SUBMISSION_INTERVAL = 10;

// In-memory cache for recent submissions (rate limiting only)
const recentSubmissions = new Map<string, number>();

async function generateContractBasedNonce(player: string): Promise<number> {
  try {
    // Create provider and contract instance
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Get the last used nonce for this player
    const lastNonce = await contract.lastScoreNonce(player);
    console.log(`Contract returned last nonce for ${player}: ${lastNonce.toString()}`);
    
    // Add a random number (1-1000) to the last nonce to make it unpredictable
    const randomIncrement = Math.floor(Math.random() * 1000) + 1;
    const nextNonce = lastNonce.add(randomIncrement);
    console.log(`Generated next nonce: ${nextNonce.toString()} (last + ${randomIncrement})`);
    
    return nextNonce.toNumber();
  } catch (error) {
    console.error('Error reading nonce from contract:', error);
    // Fallback to timestamp-based nonce if contract call fails
    const now = Date.now() * 1000000;
    const random = Math.floor(Math.random() * 1000000);
    const fallbackNonce = now + random;
    console.log(`Using fallback nonce: ${fallbackNonce}`);
    return fallbackNonce;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== API HANDLER CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    console.log('Method not allowed:', req.method);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  
  console.log('Processing POST request...');
  try {
    const { player, score } = req.body;

    // Input validation
    if (!ethers.utils.isAddress(player)) {
      return res.status(400).json({ error: "Invalid player address" });
    }

    if (!score || typeof score !== 'number' || score < 0 || score > MAX_SCORE) {
      return res.status(400).json({ error: "Invalid score" });
    }

    // Rate limiting check
    const lastSubmission = recentSubmissions.get(player);
    const now = Math.floor(Date.now() / 1000);
    if (lastSubmission && now - lastSubmission < MIN_SUBMISSION_INTERVAL) {
      return res.status(429).json({ 
        error: "Too many submissions",
        retryAfter: MIN_SUBMISSION_INTERVAL - (now - lastSubmission)
      });
    }

    // Update submission timestamp
    recentSubmissions.set(player, now);

    // Clean up old submissions (older than 1 hour)
    const oneHourAgo = now - 3600;
    for (const [addr, timestamp] of recentSubmissions.entries()) {
      if (timestamp < oneHourAgo) {
        recentSubmissions.delete(addr);
      }
    }

    // Generate a nonce based on the contract's last used nonce
    const nonce = await generateContractBasedNonce(player);
    console.log(`Generated nonce for player ${player}: ${nonce}`);

    // Sign the message
    const messageHash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256"],
      [player, score, nonce]
    );
    const messageHashBytes = ethers.utils.arrayify(messageHash);
    const signature = await wallet.signMessage(messageHashBytes);

    // Log successful submission
    console.log(`Score signed for player ${player}: ${score} points`);

    res.status(200).json({ 
      signature,
      nonce,
      timestamp: now,
      messageHash
    });
  } catch (error) {
    console.error('Error signing score:', error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 