import React from 'react';
import ReactDOM from 'react-dom/client';
import { GlyphWalletProvider } from '@use-glyph/sdk-react';
import { apeChain } from 'viem/chains';
import type { Chain } from 'viem';
import App from './App';

const supportedChains: [Chain, ...Chain[]] = [apeChain];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlyphWalletProvider chains={supportedChains} askForSignature={true}>
      <App />
    </GlyphWalletProvider>
  </React.StrictMode>
); 