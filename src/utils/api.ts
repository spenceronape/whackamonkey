import { ethers } from 'ethers';

interface SignScoreResponse {
  signature: string;
  timestamp: number;
  messageHash: string;
}

interface SignScoreError {
  error: string;
  message?: string;
  retryAfter?: number;
}

export async function signScore(
  player: string,
  score: number,
  nonce: number
): Promise<SignScoreResponse> {
  try {
    const response = await fetch('/api/sign-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player,
        score,
        nonce,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as SignScoreError;
      throw new Error(error.message || error.error || 'Failed to sign score');
    }

    return data as SignScoreResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to sign score');
  }
}

// Helper to generate a random nonce
export function generateNonce(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// Helper to verify a signature
export function verifySignature(
  player: string,
  score: number,
  nonce: number,
  signature: string
): boolean {
  try {
    const messageHash = ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'uint256'],
      [player, score, nonce]
    );
    const messageHashBytes = ethers.utils.arrayify(messageHash);
    const recoveredAddress = ethers.utils.verifyMessage(messageHashBytes, signature);
    return recoveredAddress.toLowerCase() === player.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
} 