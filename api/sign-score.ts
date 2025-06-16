import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from "ethers";

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { player, score, nonce } = req.body;

  // TODO: Add anti-cheat/validation logic here
  if (!ethers.utils.isAddress(player) || !score || !nonce) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const messageHash = ethers.utils.solidityKeccak256(
    ["address", "uint256", "uint256"],
    [player, score, nonce]
  );
  const messageHashBytes = ethers.utils.arrayify(messageHash);
  const signature = await wallet.signMessage(messageHashBytes);

  res.status(200).json({ signature });
} 