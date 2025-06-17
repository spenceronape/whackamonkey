import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import { GlyphWalletProvider } from '@use-glyph/sdk-react';
import { WagmiConfig, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apeChain } from 'viem/chains';
import { EventEmitter } from 'events';

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

const config = createConfig({
  chains: [apeChain],
  transports: {
    [apeChain.id]: http()
  }
});
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <GlyphWalletProvider
          chains={[apeChain]}
          askForSignature={false}
          autoConnect={false}
          reconnectOnMount={false}
          disableAutoConnect={true}
          disableInjectedProvider={true}
          maxListeners={20}
          cleanupOnUnmount={true}
        >
          <ChakraProvider>
            <App />
          </ChakraProvider>
        </GlyphWalletProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
); 