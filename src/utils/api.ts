import { keccak256, arrayify, verifyMessage, AbiCoder } from 'ethers/lib/utils';

export const generateNonce = () => {
  return Math.floor(Math.random() * 1000000);
};

export const verifySignature = (player: string, score: number, nonce: number, signature: string) => {
  const abiCoder = new AbiCoder();
  const messageHash = keccak256(
    abiCoder.encode(
      ["address", "uint256", "uint256"],
      [player, score, nonce]
    )
  );
  const messageHashBytes = arrayify(messageHash);
  const recoveredAddress = verifyMessage(messageHashBytes, signature);
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