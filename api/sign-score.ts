import { Wallet } from 'ethers';
import { isAddress, solidityKeccak256, arrayify } from 'ethers/lib/utils';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new Wallet(PRIVATE_KEY!);

// Maximum allowed score to prevent cheating
const MAX_SCORE = 2000;
// Minimum time between submissions (in seconds)
const MIN_SUBMISSION_INTERVAL = 60;

// In-memory cache for recent submissions
const recentSubmissions = new Map<string, number>();

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
    const { player, score, nonce } = req.body;

    // Input validation
    if (!isAddress(player)) {
      return res.status(400).json({ error: "Invalid player address" });
    }

    if (!score || typeof score !== 'number' || score < 0 || score > MAX_SCORE) {
      return res.status(400).json({ error: "Invalid score" });
    }

    if (!nonce || typeof nonce !== 'number' || nonce < 0) {
      return res.status(400).json({ error: "Invalid nonce" });
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

    // Sign the message
    const messageHash = solidityKeccak256(
      ["address", "uint256", "uint256"],
      [player, score, nonce]
    );
    const messageHashBytes = arrayify(messageHash);
    const signature = await wallet.signMessage(messageHashBytes);

    // Log successful submission
    console.log(`Score signed for player ${player}: ${score} points`);

    res.status(200).json({ 
      signature,
      timestamp: now,
      messageHash: messageHash
    });
  } catch (error) {
    console.error('Error signing score:', error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export const signScore = async (player: string, score: number, nonce: number) => {
  const response = await fetch('/api/sign-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, score, nonce }),
  });
  return response.json();
}; 