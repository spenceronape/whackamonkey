import React from 'react';
import { ChakraProvider } from '@chakra-ui/react'
import { WagmiConfig, createConfig } from 'wagmi'
import { http } from 'viem'
import { GlyphWalletProvider } from '@use-glyph/sdk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Game from './components/Game'

const apeChain = {
  id: 33139,
  name: 'ApeChain',
  network: 'apechain',
  nativeCurrency: {
    name: 'APE',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.apechain.com'] },
    public: { http: ['https://rpc.apechain.com'] },
  },
  blockExplorers: {
    default: { name: 'ApeScan', url: 'https://apescan.io' },
  },
};

const config = createConfig({
  chains: [apeChain],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <GlyphWalletProvider chains={[apeChain]}>
          <ChakraProvider>
            <Game />
          </ChakraProvider>
        </GlyphWalletProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
}

export default App 