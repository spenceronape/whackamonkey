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

export const signScore = async (player: string, score: number, nonce: number) => {
  const response = await fetch('/api/sign-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, score, nonce }),
  });
  return response.json();
};

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