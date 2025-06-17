import { Wallet, ethers } from 'ethers';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new Wallet(PRIVATE_KEY!);

// Maximum allowed score to prevent cheating
const MAX_SCORE = 2000;
// Minimum time between submissions (in seconds)
const MIN_SUBMISSION_INTERVAL = 60;

// In-memory cache for recent submissions
const recentSubmissions = new Map<string, number>();
// Track used nonces per player
const usedNonces = new Map<string, Set<string>>();

function generateUniqueNonce(player: string): string {
  let nonce: string;
  do {
    nonce = randomBytes(8).toString('hex'); // 64-bit hex string
  } while (usedNonces.get(player)?.has(nonce));
  if (!usedNonces.has(player)) usedNonces.set(player, new Set());
  usedNonces.get(player)!.add(nonce);
  return nonce;
}

function markNonceUsed(player: string, nonce: string) {
  if (usedNonces.has(player)) {
    usedNonces.get(player)!.delete(nonce);
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
    // Clean up old nonces (optional, for memory management)
    for (const [addr, nonces] of usedNonces.entries()) {
      if (nonces.size === 0) usedNonces.delete(addr);
    }

    // Generate a unique, secure nonce for this player
    const nonce = generateUniqueNonce(player);

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