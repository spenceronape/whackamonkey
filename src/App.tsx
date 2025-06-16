import { ChakraProvider, Box } from '@chakra-ui/react'
import { WagmiConfig, createConfig, http } from 'wagmi'
import { GlyphWalletProvider } from '@use-glyph/sdk-react'
import { apeChain } from 'viem/chains'
import Game from './components/Game'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  chains: [apeChain],
  transports: {
    [apeChain.id]: http()
  }
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <GlyphWalletProvider chains={[apeChain]}>
          <ChakraProvider>
            <Box minH="100vh" bg="#1D0838">
              <Game />
            </Box>
          </ChakraProvider>
        </GlyphWalletProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
}

export default App 