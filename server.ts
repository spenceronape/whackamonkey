import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import signScoreHandler from './api/sign-score';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function createServer() {
  const app = express();
  
  // Configure CORS
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://whack.mistermonkee.com', 'https://www.whack.mistermonkee.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());

  // Create Vite server
  const vite = await createViteServer({
    server: {
      port: 3000,
      host: true,
      hmr: {
        port: 3000
      }
    },
    appType: 'spa'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // API routes
  app.post('/api/sign-score', signScoreHandler);

  return app;
}

createServer().then(app => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}); 