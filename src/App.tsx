import { ChakraProvider, Box } from '@chakra-ui/react'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { GlyphWalletProvider } from '@use-glyph/sdk-react'
import { publicProvider } from 'wagmi/providers/public'
import { apeChain } from 'viem/chains'
import Game from './components/Game'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { chains, publicClient } = configureChains(
  [apeChain],
  [publicProvider()]
)

const config = createConfig({
  autoConnect: true,
  publicClient,
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <GlyphWalletProvider>
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