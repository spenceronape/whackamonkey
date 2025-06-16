import React, { useEffect, useState } from 'react';
import { ChakraProvider, extendTheme, Box, Flex, Text, useBreakpointValue, HStack, VStack, useDisclosure, Button } from '@chakra-ui/react'
import { NativeGlyphConnectButton, GlyphWidget } from '@use-glyph/sdk-react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers, Contract } from 'ethers'
import { WHACK_A_MONKEY_ADDRESS } from './components/contractAddress'
import WHACK_A_MONKEY_ABI from './components/WhackAMonkeyABI.json'
import Game from './components/Game'
import '@use-glyph/sdk-react/style.css';
import { FaXTwitter, FaTelegram, FaGlobe } from 'react-icons/fa6';
import HallOfFameModal from './components/HallOfFameModal';

const theme = extendTheme({
  styles: {
    global: {
      '@keyframes pulse': {
        '0%': {
          transform: 'scale(1)',
          opacity: 1,
        },
        '50%': {
          transform: 'scale(1.1)',
          opacity: 0.8,
        },
        '100%': {
          transform: 'scale(1)',
          opacity: 1,
        },
      },
      'html, body': {
        background: '#1D0838',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
      },
    },
  },
})

function App() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState<Contract | null>(null);
  const [prizePool, setPrizePool] = useState<string | null>(null);
  const [highScore, setHighScore] = useState<string | null>(null);
  const [highScoreHolder, setHighScoreHolder] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Set up contract (read-only, use walletClient if available, else fallback to default provider)
  useEffect(() => {
    let provider;
    if (walletClient) {
      provider = new ethers.providers.Web3Provider(walletClient as any);
    } else {
      provider = ethers.getDefaultProvider();
    }
    const c = new Contract(WHACK_A_MONKEY_ADDRESS, WHACK_A_MONKEY_ABI, provider);
    setContract(c);
  }, [walletClient]);

  // Fetch prize pool and high score from contract
  useEffect(() => {
    const fetchStats = async () => {
      if (contract) {
        try {
          const pool = await contract.getPrizePool();
          setPrizePool(ethers.utils.formatEther(pool));
          const score = await contract.highScore();
          setHighScore(score.toString());
          const holder = await contract.highScoreHolder();
          setHighScoreHolder(holder);
        } catch (err) {
          setPrizePool(null);
          setHighScore(null);
          setHighScoreHolder(null);
        }
      }
    };
    fetchStats();
    // Optionally, poll every 10s for live updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [contract]);

  return (
    <ChakraProvider theme={theme}>
      {/* Header Navigation Bar */}
      <Box as="header" w="100%" bg="#1D0838" px={{ base: 2, md: 8 }} py={{ base: 2, md: 4 }} zIndex={100} position="relative">
        <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
          {/* Logo/Title and Stats */}
          <Flex align="center">
            <Box position="relative" h={{ base: '36px', md: '48px' }}>
              {/* Purple circle behind the A */}
              <Box
                position="absolute"
                left={{ base: '38px', md: '52px' }}
                top={{ base: '2px', md: '4px' }}
                w={{ base: '28px', md: '38px' }}
                h={{ base: '28px', md: '38px' }}
                bg="#a259e6"
                borderRadius="full"
                zIndex={1}
              />
              <Text
                as="span"
                fontFamily="Luckiest Guy, Impact, 'Comic Sans MS', cursive, sans-serif"
                fontWeight="bold"
                fontSize={{ base: '2xl', md: '4xl' }}
                color="#FFD600"
                letterSpacing={{ base: '1px', md: '2px' }}
                textShadow="2px 2px 0 #6d1a7b, 0 2px 8px #000"
                zIndex={2}
                position="relative"
              >
                Whack <Box as="span" color="#FFD600" position="relative" zIndex={2}>A</Box> Monkey
              </Text>
            </Box>
            {/* Stats next to title */}
            <HStack
              spacing={{ base: 2, md: 6 }}
              ml={{ base: 2, md: 8 }}
              flexWrap="wrap"
              alignItems={{ base: 'flex-start', md: 'center' }}
              flexDirection={{ base: 'column', md: 'row' }}
            >
              <VStack spacing={0} align="start" minW={{ base: '120px', md: 'unset' }}>
                <Text color="green.300" fontWeight="bold" fontSize="sm">Prize Pool</Text>
                <Text color="green.100" fontSize="lg" fontWeight="extrabold">
                  {prizePool !== null ? `${prizePool} $APE` : '...'}
                </Text>
              </VStack>
              <VStack spacing={0} align="start" minW={{ base: '120px', md: 'unset' }}>
                <Text color="purple.300" fontWeight="bold" fontSize="sm">High Score</Text>
                <HStack spacing={1} align="baseline" flexWrap="wrap">
                  <Text color="purple.100" fontSize="lg" fontWeight="extrabold">
                    {highScore !== null ? highScore : '...'}
                  </Text>
                  {highScoreHolder && highScore !== null && (
                    <Text color="gray.400" fontSize="xs" ml={1} wordBreak="break-all">
                      ({highScoreHolder.slice(0, 6)}...{highScoreHolder.slice(-4)})
                    </Text>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </Flex>
          {/* Hall of Fame Button and Wallet Widget */}
          <HStack spacing={4}>
            <Button colorScheme="yellow" variant="outline" size="sm" onClick={onOpen}>
              Hall of Fame
            </Button>
            {isConnected ? (
              <Box className="glyph-widget-horizontal">
                <GlyphWidget
                  buttonProps={{
                    showAvatar: false,
                    showBalance: true,
                    showUsername: false
                  }}
                />
              </Box>
            ) : (
              <NativeGlyphConnectButton />
            )}
          </HStack>
        </Flex>
      </Box>
      <HallOfFameModal isOpen={isOpen} onClose={onClose} />
      {/* Main Game */}
      <Box minH="100vh" w="100vw" bg="#1D0838" pt={0} m={0} p={0}>
        <Game />
        {/* Bottom Navigation Bar */}
        <Box as="footer" position="fixed" left={0} bottom={0} w="100vw" bg="#1D0838" borderTop="2px solid #2d0a4b" px={{ base: 2, md: 8 }} py={2} zIndex={200} boxShadow="0 -2px 12px #1D0838">
          <Flex align="flex-end" justify="space-between" maxW="1200px" mx="auto" direction={{ base: 'column', md: 'row' }}>
            <Box color="gray.400" fontSize="sm" textAlign={{ base: 'center', md: 'left' }}>
              <Text fontSize="md" color="yellow.200" fontWeight="bold">© 2025 Mister Monkee Labs Worldwide</Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                *High Score may claim 75% of current pooled $APE, minus operator fees and buffer for the next winner.
              </Text>
            </Box>
            <HStack spacing={4} mt={{ base: 3, md: 0 }} justify="flex-end">
              <Box as="a" href="https://x.com/monkeeMister/" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <FaXTwitter size={28} color="#FFD600" />
              </Box>
              <Box as="a" href="https://t.me/mistermonkeeverse" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <FaTelegram size={28} color="#FFD600" />
              </Box>
              <Box as="a" href="https://its.mistermonkee.com" target="_blank" rel="noopener noreferrer" aria-label="Web">
                <FaGlobe size={28} color="#FFD600" />
              </Box>
            </HStack>
          </Flex>
        </Box>
      </Box>
    </ChakraProvider>
  )
}

export default App 