import { ethers } from 'ethers';
import { keccak256, arrayify, concat, toUtf8Bytes, recoverAddress } from 'ethers/lib/utils';
import { AbiCoder } from '@ethersproject/abi';

interface SignScoreResponse {
  signature: string;
  messageHash: string;
}

interface SignScoreError {
  error: string;
  message?: string;
  retryAfter?: number;
}

export function generateNonce(): number {
  return Math.floor(Math.random() * 1000000);
}

export async function signScore(
  address: string,
  score: number,
  nonce: number
): Promise<SignScoreResponse> {
  try {
    // Ensure the address matches the currently connected wallet
    let connected: string | null = null;
    if (window.ethereum && typeof window.ethereum.selectedAddress === 'string') {
      connected = window.ethereum.selectedAddress.toLowerCase();
    }
    if (connected && address.toLowerCase() !== connected) {
      throw new Error(`Connected wallet address (${connected}) does not match provided address (${address}). Please reconnect your wallet.`);
    }
    // Match the contract's hash format
    const abiCoder = new AbiCoder();
    const hash = keccak256(
      abiCoder.encode(
        ['address', 'uint256', 'uint256'],
        [address, score, nonce]
      )
    );
    
    if (!window.ethereum) {
      throw new Error('Ethereum provider not found');
    }
    
    const signature = await (window.ethereum.request as any)({
      method: 'personal_sign',
      params: [hash, address],
    });
    
    return { signature, messageHash: hash };
  } catch (error) {
    console.error('Error signing score:', error);
    throw error;
  }
}

export function verifySignature(
  address: string,
  score: number,
  nonce: number,
  signature: string
): boolean {
  try {
    // Use the same plain string message
    const message = `Score: ${score}, Nonce: ${nonce}`;
    const recoveredAddress = recoverAddress(
      keccak256(
        concat([
          toUtf8Bytes('\x19Ethereum Signed Message:\n' + message.length),
          toUtf8Bytes(message)
        ])
      ),
      signature
    );
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// New function for Glyph signing
export async function signScoreWithGlyph(
  signMessage: (params: { message: string }) => Promise<string>,
  address: string,
  score: number,
  nonce: number
): Promise<SignScoreResponse> {
  // Use a plain string message for compatibility
  const message = `Score: ${score}, Nonce: ${nonce}`;
  try {
    const signature = await signMessage({ message });
    return { signature, messageHash: message };
  } catch (error) {
    console.error('Error signing score with Glyph:', error);
    throw error;
  }
} 