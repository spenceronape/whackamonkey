import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import signScoreHandler from './api/sign-score';
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { signScore as signScoreUtil } from './src/utils/api';

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
    const { player, score, nonce } = req.body;
    const signature = await signScoreUtil(player, score, nonce);
    res.json({ signature });
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