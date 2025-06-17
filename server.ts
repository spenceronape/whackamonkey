import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

// Import the signing logic directly
import { randomBytes } from 'crypto';

const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY!);

// Maximum allowed score to prevent cheating
const MAX_SCORE = 2000;
// Minimum time between submissions (in seconds) - reduced for better UX
const MIN_SUBMISSION_INTERVAL = 10;

// In-memory cache for recent submissions
const recentSubmissions = new Map<string, number>();
// Track active sessions per player (session expires after 1 hour)
const playerSessions = new Map<string, { sessionId: number; lastNonce: number; timestamp: number }>();

function generateSecureNonce(player: string): number {
  const now = Math.floor(Date.now() / 1000);
  const sessionTimeout = 3600; // 1 hour session timeout
  
  // Get or create session
  let session = playerSessions.get(player);
  if (!session || (now - session.timestamp) > sessionTimeout) {
    // Create new session with very high timestamp-based session ID
    // Use current timestamp * 1000000 to ensure we're always above any previous nonce
    const sessionId = now * 1000000 + Math.floor(Math.random() * 1000000);
    session = { sessionId, lastNonce: 0, timestamp: now };
    playerSessions.set(player, session);
  }
  
  // Generate nonce based on session ID and increment
  session.lastNonce += 1;
  session.timestamp = now; // Update session timestamp
  
  // The session ID is already very high, just add the nonce counter
  const nonce = session.sessionId + session.lastNonce;
  
  return nonce;
}

async function createServer() {
  const app = express();
  app.use(express.json());

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // API routes
  app.post('/api/sign-score', async (req, res) => {
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
      const { player, score } = req.body;

      // Input validation
      if (!ethers.utils.isAddress(player)) {
        return res.status(400).json({ error: "Invalid player address" });
      }

      if (!score || typeof score !== 'number' || score < 0 || score > MAX_SCORE) {
        return res.status(400).json({ error: "Invalid score" });
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
      // Clean up expired sessions (older than 1 hour)
      for (const [addr, session] of playerSessions.entries()) {
        if ((now - session.timestamp) > 3600) {
          playerSessions.delete(addr);
        }
      }

      // Generate a unique, secure nonce for this player
      const nonce = generateSecureNonce(player);
      console.log(`Generated nonce for player ${player}: ${nonce}`);

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
        nonce,
        timestamp: now,
        messageHash
      });
    } catch (error) {
      console.error('Error signing score:', error);
      res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Handle all other routes with Vite's dev server
  app.use('*', async (req: Request, res: Response) => {
    try {
      // Read index.html
      const template = fs.readFileSync(
        path.resolve(process.cwd(), 'index.html'),
        'utf-8'
      );

      // Apply Vite HTML transforms
      const transformedTemplate = await vite.transformIndexHtml(
        req.originalUrl,
        template
      );

      // Send the rendered HTML back
      res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedTemplate);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      res.status(500).end((e as Error).message);
    }
  });

  return app;
}

createServer().then(app => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}); 