import { keccak256, arrayify, verifyMessage, AbiCoder, solidityKeccak256 } from 'ethers/lib/utils';

const TRUSTED_SIGNER = '0xE6Fce09AeC92fC6bE141a2C8CaaF5b01f62FC47F';

export const generateNonce = () => {
  return Math.floor(Math.random() * 1000000);
};

export const verifySignature = (player: string, score: number, nonce: number, signature: string) => {
  const messageHash = solidityKeccak256(
    ["address", "uint256", "uint256"],
    [player, score, nonce]
  );
  const messageHashBytes = arrayify(messageHash);
  const recoveredAddress = verifyMessage(messageHashBytes, signature);
  return recoveredAddress.toLowerCase() === TRUSTED_SIGNER.toLowerCase();
};

export const signScore = async (player: string, score: number, nonce: number) => {
  const response = await fetch('/api/sign-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, score, nonce }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} - ${text}`);
  }
  return response.json();
}; 