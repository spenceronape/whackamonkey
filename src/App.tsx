import { useEffect, useState } from 'react';
import { Box, Flex, Text, HStack, VStack, useDisclosure, Button } from '@chakra-ui/react'
import { useWalletClient, useAccount } from 'wagmi'
import { ethers, Contract } from 'ethers'
import { WHACK_A_MONKEY_ADDRESS } from './components/contractAddress'
import WHACK_A_MONKEY_ABI from './components/WhackAMonkeyABI.json'
import Game from './components/Game'
import AdminPanel from './components/AdminPanel'
import '@use-glyph/sdk-react/style.css'
import { FaXTwitter, FaTelegram, FaGlobe } from 'react-icons/fa6'
import { FaGithub } from 'react-icons/fa'
import HallOfFameModal from './components/HallOfFameModal'
import { Global } from '@emotion/react';

function App() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [contract, setContract] = useState<Contract | null>(null);
  const [prizePool, setPrizePool] = useState<string | null>(null);
  const [highScore, setHighScore] = useState<string | null>(null);
  const [highScoreHolder, setHighScoreHolder] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Admin wallet address
  const ADMIN_WALLET_ADDRESS = '0x4d6f6f4ef5e5f74074Ad0798CE44436491750A2E';

  // Set up contract (read-only, use walletClient if available, else fallback to default provider)
  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.providers.Web3Provider(walletClient as any);
      const c = new Contract(WHACK_A_MONKEY_ADDRESS, WHACK_A_MONKEY_ABI, provider);
      setContract(c);
    } else {
      setContract(null);
    }
  }, [walletClient]);

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (contract && address) {
        try {
          // Check if current wallet is the admin wallet
          const isAdminWallet = address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase();
          
          if (isAdminWallet) {
            // Check if admin wallet is an operator
            const isOperator = await (contract as any).isOperator(ADMIN_WALLET_ADDRESS);
            setIsAdmin(isOperator);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminAccess();
  }, [contract, address]);

  // Fetch prize pool and high score from contract
  useEffect(() => {
    const fetchStats = async () => {
      if (contract) {
        try {
          const pool = await contract.getPrizePool();
          // Calculate winner's share (50%)
          const winnerShare = ethers.utils.formatEther(pool.mul(50).div(100));
          setPrizePool(winnerShare);
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
    <>
      <Global
        styles={`
          html, body, #root {
            background: #1D0838 !important;
            min-height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
            border: none;
          }
        `}
      />
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
                cursor="pointer"
                onClick={() => window.location.reload()}
                _hover={{ transform: 'scale(1.05)', transition: 'all 0.2s' }}
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
          {/* Hall of Fame and Admin Buttons */}
          <HStack spacing={4}>
            <Button colorScheme="yellow" variant="outline" size="sm" onClick={onOpen}>
              Hall of Fame
            </Button>
            {isAdmin && (
              <Button 
                colorScheme="red" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
              >
                {showAdminPanel ? 'Hide Admin' : 'Admin Panel'}
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>
      <HallOfFameModal isOpen={isOpen} onClose={onClose} />
      {/* Admin Panel */}
      {showAdminPanel && isAdmin && (
        <Box w="100%" bg="#1D0838" px={{ base: 2, md: 8 }} py={4}>
          <AdminPanel />
        </Box>
      )}
      {/* Main Game */}
      <Box minH="100vh" w="100vw" bg="#1D0838" pt={0} m={0} p={0}>
        <Game />
        {/* Bottom Navigation Bar */}
        <Box as="footer" position="fixed" left={0} bottom={0} w="100vw" bg="#1D0838" px={{ base: 2, md: 8 }} py={4} mb={{ base: 4, md: 6 }} zIndex={200} m={0} p={0}>
          <Flex align="flex-end" justify="space-between" maxW="1200px" mx="auto" direction={{ base: 'column', md: 'row' }}>
            <Box color="gray.400" fontSize="sm" textAlign={{ base: 'center', md: 'left' }}>
              <Text fontSize="md" color="yellow.200" fontWeight="bold">© 2025 Mister Monkee Labs Worldwide</Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                *High Score may claim 50% of pooled $APE, minus operator fee, buffer kept for future winners.
              </Text>
              <Text fontSize="xs" color="yellow.300" mt={2}>
                <a href="/TERMS_AND_CONDITIONS.md" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                  Terms and Conditions
                </a>
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
              <Box as="a" href="https://github.com/spenceronape/whackamonkey/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FaGithub size={28} color="#FFD600" />
              </Box>
            </HStack>
          </Flex>
        </Box>
      </Box>
    </>
  )
}

export default App 