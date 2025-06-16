import { ethers } from "ethers";
import type { Request, Response } from 'express';

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY!);

// Maximum allowed score to prevent cheating
const MAX_SCORE = 1000;
// Minimum time between submissions (in seconds)
const MIN_SUBMISSION_INTERVAL = 60;

// In-memory cache for recent submissions
const recentSubmissions = new Map<string, number>();

export default async function handler(req: Request, res: Response) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { player, score, nonce } = req.body;

    // Input validation
    if (!ethers.utils.isAddress(player)) {
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