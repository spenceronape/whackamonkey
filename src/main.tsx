import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import { GlyphWalletProvider } from '@use-glyph/sdk-react';
import { apeChain } from 'viem/chains';
import { EventEmitter } from 'events';

// Configure supported chains
const supportedChains = [apeChain];

// Set up event emitter limits
if (typeof window !== 'undefined') {
  EventEmitter.defaultMaxListeners = 20; // Increase the limit

  // Suppress RPC errors from eth-mainnet
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [resource] = args;
    if (typeof resource === 'string' && (
      resource.includes('eth-mainnet.alchemyapi.io') ||
      resource.includes('eth-mainnet.gateway.pokt.network') ||
      resource.includes('rpc.ankr.com/eth')
    )) {
      try {
        return await originalFetch.apply(window, args);
      } catch (error) {
        // Silently handle the error
        return new Response(JSON.stringify({ error: 'RPC request suppressed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return originalFetch.apply(window, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlyphWalletProvider 
      chains={supportedChains} 
      askForSignature={false}
      autoConnect={false}
      reconnectOnMount={false}
      disableAutoConnect={true}
      disableInjectedProvider={true}
      // Add these options to handle event listeners
      maxListeners={20}
      cleanupOnUnmount={true}
    >
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </GlyphWalletProvider>
  </React.StrictMode>,
); 