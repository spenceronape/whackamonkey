import { ethers } from 'ethers';

export const generateNonce = () => {
  return Math.floor(Math.random() * 1000000);
};

export const verifySignature = (player: string, score: number, nonce: number, signature: string) => {
  const messageHash = ethers.utils.solidityKeccak256(
    ["address", "uint256", "uint256"],
    [player, score, nonce]
  );
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  const recoveredAddress = ethers.utils.verifyMessage(messageHashBytes, signature);
  return recoveredAddress.toLowerCase() === player.toLowerCase();
};

export const signScore = async (player: string, score: number, nonce: number) => {
  const response = await fetch('/api/sign-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player, score, nonce }),
  });
  return response.json();
}; 