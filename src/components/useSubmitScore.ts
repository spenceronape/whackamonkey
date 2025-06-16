import { useState } from "react";
import { ethers } from "ethers";

export function useSubmitScore(contract: any, player: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitScore(score: number) {
    setLoading(true);
    setError(null);
    try {
      // 1. Generate a unique nonce (timestamp)
      const nonce = Date.now();

      // 2. Request signature from backend
      const response = await fetch("/api/sign-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, score, nonce }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signature error");
      const { signature } = data;

      // 3. Submit to contract
      const tx = await contract.submitScore(score, nonce, signature);
      await tx.wait();
      setLoading(false);
      return { success: true };
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error');
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  return { submitScore, loading, error };
} 