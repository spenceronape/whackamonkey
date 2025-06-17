import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, VStack, HStack, Text, Button, Image, IconButton, Heading, UnorderedList, ListItem, Spinner } from '@chakra-ui/react'
import { useAccount, useWalletClient } from 'wagmi'
import { NativeGlyphConnectButton, GLYPH_ICON_URL, useGlyph } from '@use-glyph/sdk-react'
import { FaVolumeMute, FaVolumeUp, FaTwitter } from 'react-icons/fa'
import Confetti from 'react-confetti'
import { ethers } from 'ethers'
import WHACK_A_MONKEY_ABI from './WhackAMonkeyABI.json'
import { WHACK_A_MONKEY_ADDRESS } from './contractAddress'
import { Contract } from 'ethers'
import { signScore, generateNonce, verifySignature } from '../utils/api'
import { GlyphWidget } from '@use-glyph/sdk-react'

// Game constants
const GAME_DURATION = 60 // seconds
const HOLE_COUNT = 12
const MIN_ACTIVE_HOLES = 3
const MAX_ACTIVE_HOLES = 6
const GAME_COST = '2.50' // APE tokens (2 $APE to prize pool, 0.50 $APE to operator)
const MONKEY_LIFETIME_START = 2000 // ms
const MONKEY_LIFETIME_END = 800 // ms
const CRUSHED_DISPLAY_TIME = 400; // ms
const GAME_COST_WEI = ethers.utils.parseEther('2.5');

// Responsive, percentage-based coordinates for each hole
const HOLE_POSITIONS = [
  { left: '28.13%', top: '32.39%' }, // 1
  { left: '42.08%', top: '28.70%' }, // 2
  { left: '57.60%', top: '29.62%' }, // 3
  { left: '71.72%', top: '32.66%' }, // 4
  { left: '21.93%', top: '57.76%' }, // 5
  { left: '41.41%', top: '58.87%' }, // 6
  { left: '57.86%', top: '59.33%' }, // 7
  { left: '75.83%', top: '58.12%' }, // 8
  { left: '24.69%', top: '87.09%' }, // 9
  { left: '40.26%', top: '87.37%' }, // 10
  { left: '57.45%', top: '86.72%' }, // 11
  { left: '75.83%', top: '86.23%' }, // 12
]

// Sound files for monkey hit
const HIT_SOUNDS = [
  '/assets/sounds/famous.mp3',
  '/assets/sounds/hate.mp3',
  '/assets/sounds/ouch.mp3',
  '/assets/sounds/ow.mp3',
  '/assets/sounds/pal.mp3',
  '/assets/sounds/star.mp3',
  '/assets/sounds/stopit.mp3',
  '/assets/sounds/thathurts.mp3',
];

// Helper to generate a random offset in px
function getRandomOffsetPx() {
  return Math.floor(Math.random() * 15) - 7; // -7 to +7 px
}

// Game states
type GameState = 'idle' | 'playing' | 'gameOver' | 'winner'

type ActiveHole = {
  index: number
  hit: boolean
  offsetX: number
  offsetY: number
  crushed: boolean
  timer: NodeJS.Timeout | null
}

const Game = () => {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeHoles, setActiveHoles] = useState<ActiveHole[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [points, setPoints] = useState(0)
  const { address: playerAddress, isConnected } = useAccount()
  const { ready, authenticated, login } = useGlyph()
  const { data: walletClient } = useWalletClient()
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const MAX_MULTIPLIER = 5;
  const [contract, setContract] = useState<Contract | null>(null);
  const [readContract, setReadContract] = useState<Contract | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<number>(generateNonce());
  const [isWhacking, setIsWhacking] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [prizePool, setPrizePool] = useState<string | null>(null);
  const [scoreSignature, setScoreSignature] = useState<string | null>(null);
  const [signingScore, setSigningScore] = useState(false);
  const [signScoreError, setSignScoreError] = useState<string | null>(null);
  const [prizeClaimed, setPrizeClaimed] = useState(false);
  const [highScore, setHighScore] = useState<number | null>(null);

  // Preload sounds
  const hitAudioRefs = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    hitAudioRefs.current = HIT_SOUNDS.map(src => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      return audio;
    });
  }, []);

  // Ref to always have the latest points value
  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);

  // Helper to spawn a new monkey
  const spawnMonkey = useCallback((lifetime: number) => {
    setActiveHoles(prev => {
      // Find available holes
      const taken = prev.map(h => h.index)
      const available = Array.from({ length: HOLE_COUNT }, (_, i) => i).filter(i => !taken.includes(i))
      if (available.length === 0) return prev
      const newHoleIndex = available[Math.floor(Math.random() * available.length)]
      const offsetX = getRandomOffsetPx()
      const offsetY = getRandomOffsetPx()
      let timer: NodeJS.Timeout | null = null
      timer = setTimeout(() => {
        setActiveHoles(current => {
          const found = current.find(h => h.index === newHoleIndex && !h.hit)
          if (found) {
            setMisses(m => m + 1)
            return current.filter(h => h.index !== newHoleIndex)
          }
          return current
        })
      }, lifetime)
      return [
        ...prev,
        {
          index: newHoleIndex,
          hit: false,
          offsetX,
          offsetY,
          crushed: false,
          timer,
        },
      ]
    })
  }, [])

  // Game loop for time
  useEffect(() => {
    let timeInterval: NodeJS.Timeout
    if (gameState === 'playing') {
      timeInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState(pointsRef.current > (highScore ?? 0) ? 'winner' : 'gameOver');
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      clearInterval(timeInterval)
    }
  }, [gameState])

  // Maintain 3-6 monkeys on board, each with their own timer
  useEffect(() => {
    if (gameState !== 'playing') return
    // Calculate current monkey lifetime based on time left
    const progress = 1 - timeLeft / GAME_DURATION;
    const monkeyLifetime = Math.round(
      MONKEY_LIFETIME_START + (MONKEY_LIFETIME_END - MONKEY_LIFETIME_START) * Math.sqrt(progress)
    );
    // Spawn monkeys if needed
    if (activeHoles.length < MIN_ACTIVE_HOLES) {
      for (let i = activeHoles.length; i < MIN_ACTIVE_HOLES; i++) {
        spawnMonkey(monkeyLifetime)
      }
    } else if (activeHoles.length < MAX_ACTIVE_HOLES) {
      // Randomly decide to spawn up to MAX_ACTIVE_HOLES
      if (Math.random() < 0.3) { // Reduced spawn rate
        spawnMonkey(monkeyLifetime)
      }
    }
  }, [activeHoles, gameState, timeLeft, spawnMonkey])

  // Reset multiplier on miss
  useEffect(() => {
    if (misses > 0) {
      setMultiplier(1);
    }
  }, [misses]);

  // Cleanup timers on game end
  useEffect(() => {
    if (gameState !== 'playing') {
      activeHoles.forEach(h => h.timer && clearTimeout(h.timer))
      setActiveHoles([])
    }
  }, [gameState])

  // Prevent scrolling in the game area on mobile
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Setup contracts for read and write
  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.providers.Web3Provider(walletClient as any);
      const signer = provider.getSigner();
      const writeContract = new Contract(WHACK_A_MONKEY_ADDRESS, WHACK_A_MONKEY_ABI, signer);
      const readOnlyContract = new Contract(WHACK_A_MONKEY_ADDRESS, WHACK_A_MONKEY_ABI, provider);
      setContract(writeContract);
      setReadContract(readOnlyContract);
      // Fetch high score
      readOnlyContract.highScore().then((score: any) => setHighScore(Number(score))).catch(() => setHighScore(null));
    } else {
      setContract(null);
      setReadContract(null);
      setHighScore(null);
    }
  }, [walletClient]);

  // Fetch high score every 10s for live updates (use readContract)
  useEffect(() => {
    if (!readContract) return;
    const fetchHighScore = async () => {
      try {
        const score = await readContract.highScore();
        setHighScore(Number(score));
      } catch {
        setHighScore(null);
      }
    };
    fetchHighScore();
    const interval = setInterval(fetchHighScore, 10000);
    return () => clearInterval(interval);
  }, [readContract]);

  const startGame = useCallback(async () => {
    setStartError(null);
    if (!contract) return;
    setStartingGame(true);
    try {
      const tx = await contract.startGame({ value: GAME_COST_WEI });
      await tx.wait();
      setGameState('playing');
      setPoints(0);
      setTimeLeft(GAME_DURATION);
      setActiveHoles([]);
      setHits(0);
      setMisses(0);
      setMultiplier(1);
      setPrizeClaimed(false);
      setScoreSignature(null);
      setSignScoreError(null);
      setSubmitError(null);
      setNonce(generateNonce());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
      
      // Check for insufficient funds error
      if (errorMessage.toLowerCase().includes('insufficient') || 
          errorMessage.toLowerCase().includes('funds') ||
          errorMessage.toLowerCase().includes('balance') ||
          errorMessage.toLowerCase().includes('gas')) {
        setStartError("THIS AIN'T A CHARITY, PAL. FUND YOUR WALLET.");
      } else {
        setStartError(errorMessage);
      }
    }
    setStartingGame(false);
  }, [contract]);

  const handleHoleClick = (holeIndex: number) => {
    if (gameState !== 'playing') return
    setActiveHoles(prev => prev.map(h => {
      if (h.index === holeIndex && !h.hit) {
        // Increase multiplier first, then update score
        const newMultiplier = Math.min(multiplier + 1, MAX_MULTIPLIER);
        setMultiplier(newMultiplier);
        setPoints(p => p + newMultiplier);
        setHits(hits => hits + 1)
        if (h.timer) clearTimeout(h.timer)
        // Play random hit sound if not muted
        if (!muted && hitAudioRefs.current.length > 0) {
          const idx = Math.floor(Math.random() * hitAudioRefs.current.length);
          const audio = hitAudioRefs.current[idx];
          audio.currentTime = 0;
          audio.play();
        }
        // Show crushed image, then remove after CRUSHED_DISPLAY_TIME
        setTimeout(() => {
          setActiveHoles(current => current.filter(hh => hh.index !== holeIndex))
        }, CRUSHED_DISPLAY_TIME)
        return { ...h, hit: true, crushed: true }
      }
      return h
    }))
  }

  // Board-level click/tap handler for misses
  const handleBoardClick = () => {
    if (gameState !== 'playing') return;
    // If we get here, it means we clicked the board but not a monkey
    setMultiplier(1);
    setMisses(m => m + 1);
  };

  const accuracy = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '100'

  // Fetch prize pool and high score from contract
  useEffect(() => {
    const fetchStats = async () => {
      if (readContract) {
        try {
          await readContract.getPrizePool();
          await readContract.highScore();
          await readContract.highScoreHolder();
        } catch (err: unknown) {
          if (err instanceof Error) {
            // Optionally log err.message
          }
        }
      }
    };
    fetchStats();
    // Optionally, poll every 10s for live updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [readContract]);

  // Fetch live prize pool and update every 10s
  useEffect(() => {
    const fetchPrizePool = async () => {
      if (readContract) {
        try {
          const pool = await readContract.getPrizePool();
          // Calculate winner's share (75%)
          const winnerShare = ethers.utils.formatEther(pool.mul(75).div(100));
          setPrizePool(winnerShare);
        } catch (err) {
          setPrizePool(null);
        }
      }
    };
    fetchPrizePool();
    const interval = setInterval(fetchPrizePool, 10000);
    return () => clearInterval(interval);
  }, [readContract]);

  // Handler for user-initiated validation
  const handleValidateScore = async () => {
    if (!playerAddress || !points || !nonce) {
      setSignScoreError('Missing player address, score, or nonce.');
      return;
    }
    setSigningScore(true);
    setSignScoreError(null);
    try {
      const { signature } = await signScore(playerAddress, points, nonce);
      setScoreSignature(signature);
    } catch (err) {
      setSignScoreError(err instanceof Error ? err.message : 'Failed to validate score');
      setScoreSignature(null);
    } finally {
      setSigningScore(false);
    }
  };

  // Update handleSubmitScore to require scoreSignature
  const handleSubmitScore = async () => {
    if (!playerAddress || !contract || !scoreSignature) return;
    setSubmittingScore(true);
    setSubmitError(null);
    try {
      if (!verifySignature(playerAddress, points, nonce, scoreSignature)) {
        throw new Error('Invalid signature');
      }
      const tx = await contract.submitScore(points, nonce, scoreSignature);
      await tx.wait();
      setNonce(generateNonce());
      setPrizeClaimed(true);
    } catch (error) {
      console.error('Error submitting score:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit score';
      if (errorMessage.toLowerCase().includes('old nonce')) {
        setSubmitError("This score has already been claimed or the session expired. Please play again!");
        setGameState('idle');
        setScoreSignature(null);
        setSignScoreError(null);
        setPrizeClaimed(false);
        setNonce(generateNonce());
      } else if (errorMessage.toLowerCase().includes('insufficient') || 
                 errorMessage.toLowerCase().includes('funds') ||
                 errorMessage.toLowerCase().includes('balance') ||
                 errorMessage.toLowerCase().includes('gas')) {
        setSubmitError("THIS AIN'T A CHARITY, PAL. FUND YOUR WALLET.");
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setSubmittingScore(false);
    }
  };

  const renderGameBoard = () => {
    return (
      <Box
        ref={gameAreaRef}
        position="relative"
        width={["98vw", "90vw", "900px"]}
        maxWidth="900px"
        aspectRatio={"1920/1084"}
        borderRadius="lg"
        boxShadow="lg"
        mt={4}
        cursor={`url('/assets/mallet.png') 32 32, pointer`}
        style={{
          backgroundImage: 'url(/assets/whackamonkeybg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={handleBoardClick}
        onTouchStart={handleBoardClick}
      >
        {/* Mute/Unmute Button */}
        <IconButton
          aria-label={muted ? 'Unmute' : 'Mute'}
          icon={muted ? <FaVolumeMute /> : <FaVolumeUp />}
          onClick={() => setMuted(m => !m)}
          position="absolute"
          top={2}
          right={2}
          zIndex={10}
          size="lg"
          bg="whiteAlpha.800"
          _hover={{ bg: 'whiteAlpha.900' }}
        />
        {activeHoles.map((hole) => {
          const pos = HOLE_POSITIONS[hole.index]
          return (
            <Box
              key={hole.index}
              position="absolute"
              left={pos.left}
              top={pos.top}
              style={{
                transform: `translate(-50%, -85%) translate(${hole.offsetX}px, ${hole.offsetY}px)`
              }}
              width={["60px", "6vw", "90px"]}
              height={["60px", "6vw", "90px"]}
              cursor="inherit"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleHoleClick(hole.index);
              }}
              onTouchStart={(e: React.TouchEvent) => {
                e.preventDefault();
                e.stopPropagation();
                handleHoleClick(hole.index);
              }}
              zIndex={2}
            >
              <Image
                src={hole.crushed ? '/assets/monkeycrushed.png' : '/assets/monkeywhackchar.png'}
                alt="Mister Monkee"
                width="100%"
                height="100%"
                draggable={false}
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              />
            </Box>
          )
        })}
      </Box>
    )
  }

  const renderGameState = () => {
    switch (gameState) {
      case 'idle':
        return (
          <VStack 
            spacing={6} 
            p={8} 
            px={{ base: 2, md: 8 }}
            bg="rgba(0, 0, 0, 0.8)" 
            borderRadius="xl"
            boxShadow="2xl"
            maxW="600px"
            w="full"
            textAlign="center"
          >
            <Heading 
              fontSize={{ base: "2xl", md: "4xl" }}
              bgGradient="linear(to-r, yellow.400, orange.500)"
              bgClip="text"
              mb={2}
            >
              WANNA' WHACK-A-MONKEY?
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.300">
              TEST YOUR REFLEXES, PAL, YOU COULD WIN BIG!
            </Text>
            <VStack spacing={2} bg="whiteAlpha.100" p={{ base: 2, md: 4 }} borderRadius="md" w="full">
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="yellow.300">STEP RIGHT UP FOR ONLY {GAME_COST} $APE</Text>
              <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>BASH IN MY BEAUTIFUL FACE TO EARN POINTS AND WIN!</Text>
            </VStack>
            <VStack spacing={3} w="full">
              <Text color="yellow.400" fontWeight="bold">How to Play:</Text>
              <UnorderedList textAlign="left" color="gray.300" spacing={2}>
                <ListItem>BONK MONKEYS AS THEY APPEAR</ListItem>
                <ListItem>BUILD YOUR MULTIPLIER WITH CONSECUTIVE HITS</ListItem>
                <ListItem>DON'T MISS OR YOUR MULTIPLIER RESETS!</ListItem>
                <ListItem>SCORE AS MANY POINTS AS POSSIBLE IN {GAME_DURATION} SECONDS</ListItem>
                <ListItem>GET THE HIGH SCORE AND WIN THE PRIZE POOL*</ListItem>
              </UnorderedList>
            </VStack>
            {!isConnected ? (
              <VStack spacing={4} w="full">
                <Text color="gray.400">Connect your wallet to play</Text>
                {/* Hidden NativeGlyphConnectButton */}
                <Box display="none">
                  <span id="glyph-connect-btn-wrapper">
                    <NativeGlyphConnectButton />
                  </span>
                </Box>
                <Button
                  colorScheme="yellow"
                  size="lg"
                  w="full"
                  h={{ base: "48px", md: "60px" }}
                  fontSize={{ base: "md", md: "xl" }}
                  leftIcon={<img src={GLYPH_ICON_URL} alt="Glyph" style={{ width: 32, height: 32 }} />}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                  onClick={() => {
                    // Find the first button inside the wrapper and click it
                    const wrapper = document.getElementById('glyph-connect-btn-wrapper');
                    if (wrapper) {
                      const btn = wrapper.querySelector('button');
                      if (btn) (btn as HTMLElement).click();
                    }
                  }}
                  aria-label="Connect wallet using Glyph"
                >
                  CONNECT VIA GLYPH, PAL
                </Button>
              </VStack>
            ) : !ready ? (
              <VStack spacing={4} w="full">
                <Text color="yellow.400">Loading...</Text>
                <Spinner color="yellow.400" size="lg" />
              </VStack>
            ) : !authenticated ? (
              <VStack spacing={4} w="full">
                <Text color="yellow.400">NOW SIGN IN, PAL</Text>
                <Button
                  colorScheme="yellow"
                  size="lg"
                  w="full"
                  h={{ base: "48px", md: "60px" }}
                  fontSize={{ base: "md", md: "xl" }}
                  leftIcon={<img src={GLYPH_ICON_URL} alt="Glyph" style={{ width: 32, height: 32 }} />}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                  onClick={() => {
                    setIsSigningIn(true);
                    login();
                  }}
                  isLoading={isSigningIn}
                  aria-label="Sign in with Glyph"
                >
                  {isSigningIn ? 'SIGNING IN...' : 'SIGN IN, PAL'}
                </Button>
              </VStack>
            ) : (
              <>
                <Button
                  colorScheme="yellow"
                  size="lg"
                  onClick={startGame}
                  w="full"
                  h={{ base: "48px", md: "60px" }}
                  fontSize={{ base: "md", md: "xl" }}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                  aria-label="Start Whack-A-Monkey game"
                  isLoading={startingGame}
                  isDisabled={startingGame || !contract}
                >
                  {startingGame ? 'Starting...' : 'START GAME, I LOVE YOU'}
                </Button>
                <Box mt={4} w="full" display="flex" justifyContent="center">
                  <Box className="glyph-widget-horizontal">
                    <GlyphWidget
                      buttonProps={{
                        showAvatar: false,
                        showBalance: true,
                        showUsername: false
                      }}
                    />
                  </Box>
                </Box>
              </>
            )}
            {startError && <Text color="red.400">{startError}</Text>}
          </VStack>
        )
      case 'playing':
        return (
          <VStack spacing={6} mt={{ base: -2, md: -8 }}>
            <Box
              bg="blackAlpha.800"
              p={{ base: 2, md: 3 }}
              borderRadius="md"
              border="2px solid"
              borderColor="yellow.400"
              boxShadow="0 0 10px rgba(255, 215, 0, 0.3)"
              width="100%"
              maxW={{ base: "99%", md: "600px" }}
              overflowX="auto"
            >
              <HStack spacing={{ base: 3, md: 6 }} justify="center" fontFamily="mono">
                <VStack spacing={0}>
                  <Text color="gray.400" fontSize={{ base: "2xs", md: "sm" }}>SCORE TO BEAT</Text>
                  <Text color="purple.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{highScore !== null ? highScore : '...'}</Text>
                </VStack>
                <Text color="yellow.400">|</Text>
                <VStack spacing={0}>
                  <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>POINTS</Text>
                  <Text color="yellow.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{points}</Text>
                </VStack>
                <Text color="yellow.400">|</Text>
                <VStack spacing={0}>
                  <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>TIME</Text>
                  <Text color="red.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{timeLeft}s</Text>
                </VStack>
                <Text color="yellow.400">|</Text>
                <VStack spacing={0}>
                  <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>PRIZE POOL</Text>
                  <Text color="green.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{prizePool ? `${prizePool} $APE` : '...'}</Text>
                </VStack>
              </HStack>
            </Box>
            {renderGameBoard()}
            <Box
              bg="blackAlpha.800"
              p={{ base: 2, md: 3 }}
              borderRadius="md"
              border="2px solid"
              borderColor="yellow.400"
              boxShadow="0 0 10px rgba(255, 215, 0, 0.3)"
              width="100%"
              maxW={{ base: "99%", md: "600px" }}
              overflowX="auto"
            >
              <HStack spacing={{ base: 3, md: 6 }} justify="center" fontFamily="mono">
                <Text color="yellow.400" fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Stats:</Text>
                <HStack spacing={{ base: 2, md: 4 }}>
                  <VStack spacing={0}>
                    <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>HITS</Text>
                    <Text color="green.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{hits}</Text>
                  </VStack>
                  <Text color="yellow.400">|</Text>
                  <VStack spacing={0}>
                    <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>MISSES</Text>
                    <Text color="red.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{misses}</Text>
                  </VStack>
                  <Text color="yellow.400">|</Text>
                  <VStack spacing={0}>
                    <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>ACCURACY</Text>
                    <Text color="blue.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{accuracy}%</Text>
                  </VStack>
                  <Text color="yellow.400">|</Text>
                  <VStack spacing={0}>
                    <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>MULTIPLIER</Text>
                    <Text color="yellow.400" fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" fontFamily="mono">{multiplier}x</Text>
                  </VStack>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        )
      case 'gameOver':
        return (
          <VStack 
            spacing={6} 
            p={8} 
            px={{ base: 2, md: 8 }}
            bg="rgba(0, 0, 0, 0.8)" 
            borderRadius="xl"
            boxShadow="2xl"
            maxW="600px"
            w="full"
            textAlign="center"
          >
            <Heading 
              fontSize={{ base: "2xl", md: "4xl" }}
              bgGradient="linear(to-r, yellow.400, orange.500)"
              bgClip="text"
              mb={2}
            >
              Game Over!
            </Heading>
            <VStack spacing={4} bg="whiteAlpha.100" p={6} borderRadius="md" w="full">
              <HStack spacing={8} justify="center">
                <VStack>
                  <Text color="gray.400">Final Points</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="yellow.400">{points}</Text>
                </VStack>
                <VStack>
                  <Text color="gray.400">Total Hits</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="yellow.400">{hits}</Text>
                </VStack>
                <VStack>
                  <Text color="gray.400">Accuracy</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="yellow.400">{accuracy}%</Text>
                </VStack>
              </HStack>
              <Text color="gray.400" fontSize="sm">
                {points > 100 ? "GREAT SCORE, PAL! 🎉" : 
                 points > 75 ? "NOT BAD, PAL! 🌟" : 
                 points > 50 ? "GOOD EFFORT, PAL! 👍" : 
                 "I LOVE YOU, PAL! 💪"}
              </Text>
            </VStack>
            <Button
              as="a"
              href={`https://x.com/intent/tweet?text=I just played Whack-A-Monkey and scored ${points} points! Think you can beat me? Play now at https://whack.mistermonkee.com`}
              target="_blank"
              leftIcon={<FaTwitter />}
              colorScheme="twitter"
              variant="outline"
              fontWeight="bold"
              fontSize="lg"
              mt={2}
              aria-label="Share your score on X (Twitter)"
            >
              Share this on X
            </Button>
            <Button 
              colorScheme="yellow" 
              size="lg" 
              onClick={startGame}
              w="full"
              h={{ base: "48px", md: "60px" }}
              fontSize={{ base: "md", md: "xl" }}
              _hover={{ transform: 'scale(1.05)' }}
              transition="all 0.2s"
              aria-label="Play Whack-A-Monkey again"
            >
              Play Again
            </Button>
          </VStack>
        )
      case 'winner':
        return (
          <Box position="relative" w="full" minH="400px">
            <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={300} recycle={false} />
            <VStack spacing={6} p={8} px={{ base: 2, md: 8 }} bg="rgba(0,0,0,0.92)" borderRadius="xl" boxShadow="2xl" maxW="600px" w="full" textAlign="center" mx="auto" mt={4}>
              <VStack spacing={1}>
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="yellow.300" textShadow="2px 2px 0 #6d1a7b, 0 2px 8px #000">
                  YOU REALLY BEAT ME UP, PAL!
                </Text>
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="yellow.300" textShadow="2px 2px 0 #6d1a7b, 0 2px 8px #000">
                  CONGRATS YOU FILTHY APE
                </Text>
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="yellow.300" textShadow="2px 2px 0 #6d1a7b, 0 2px 8px #000">
                  I LOVE YOU.
                </Text>
              </VStack>
              <Text fontSize={{ base: 'xl', md: '2xl' }} color="green.300" fontWeight="bold" letterSpacing="wide">
                YOU WON
              </Text>
              <Text fontSize={{ base: '2xl', md: '3xl' }} color="#00FFB0" fontWeight="extrabold" textShadow="0 0 8px #00FFB0">
                {prizePool ? `${prizePool} $APE` : '...'}
              </Text>
              <Button
                as="a"
                href={`https://x.com/intent/tweet?text=I just WON the prize pool in Whack-A-Monkey! Can you beat my score? Play now at https://whack.mistermonkee.com`}
                target="_blank"
                leftIcon={<FaTwitter />}
                colorScheme="twitter"
                variant="outline"
                fontWeight="bold"
                fontSize="lg"
                mt={2}
                aria-label="Share your win on X (Twitter)"
              >
                Share this on X
              </Button>
              {!scoreSignature && (
                <Button
                  colorScheme="yellow"
                  size="lg"
                  fontSize={{ base: "md", md: "xl" }}
                  fontWeight="bold"
                  px={10}
                  py={6}
                  borderRadius="full"
                  boxShadow="0 0 16px #FFD600"
                  aria-label="Validate your score"
                  isLoading={signingScore}
                  onClick={handleValidateScore}
                  isDisabled={signingScore}
                >
                  {signingScore ? 'Validating...' : 'Validate Score'}
                </Button>
              )}
              {signScoreError && <Text color="red.400">{signScoreError}</Text>}
              {scoreSignature && (
                <Button
                  colorScheme="yellow"
                  size="lg"
                  fontSize={{ base: "md", md: "xl" }}
                  fontWeight="bold"
                  px={10}
                  py={6}
                  borderRadius="full"
                  boxShadow="0 0 16px #FFD600"
                  aria-label="Claim your prize"
                  isLoading={submittingScore}
                  onClick={handleSubmitScore}
                  isDisabled={!contract || submittingScore || prizeClaimed}
                  opacity={prizeClaimed ? 0.5 : 1}
                  cursor={prizeClaimed ? 'not-allowed' : 'pointer'}
                >
                  {prizeClaimed ? 'Prize Claimed!' : (submittingScore ? 'Submitting...' : 'Claim Prize')}
                </Button>
              )}
              {prizeClaimed && (
                <Button
                  colorScheme="yellow"
                  variant="outline"
                  size="lg"
                  fontSize={{ base: "md", md: "xl" }}
                  fontWeight="bold"
                  px={10}
                  py={6}
                  borderRadius="full"
                  boxShadow="0 0 16px #FFD600"
                  aria-label="Play Again"
                  mt={2}
                  onClick={() => {
                    setPrizeClaimed(false);
                    setScoreSignature(null);
                    setSignScoreError(null);
                    setSubmitError(null);
                    setGameState('idle');
                    setNonce(generateNonce());
                  }}
                >
                  Play Again?
                </Button>
              )}
              {submitError && <Text color="red.400">{submitError}</Text>}
            </VStack>
          </Box>
        )
    }
  }

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: Event): void => {
      const event = e as KeyboardEvent;
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        if (!isWhacking) {
          setIsWhacking(true);
          handleHoleClick(0); // Assuming the first hole is clicked
        }
      }
    };

    const handleKeyUp = (e: Event): void => {
      const event = e as KeyboardEvent;
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        setIsWhacking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isWhacking, handleHoleClick]);

  return (
    <Box minH="calc(100vh - 80px)" display="flex" flexDirection="column" justifyContent="center" alignItems="center" bg="#1D0838" flexGrow={1} mt={{ base: "-5vh", md: "-15vh" }}>
      {gameState === 'playing' ? (
        <Box
          ref={gameAreaRef}
          position="relative"
          width={["98vw", "90vw", "900px"]}
          maxWidth="900px"
          aspectRatio={"1920/1084"}
          borderRadius="lg"
          boxShadow="lg"
          mt={0}
        >
          {renderGameState()}
        </Box>
      ) : (
        <Box
          position="relative"
          width={["98vw", "90vw", "900px"]}
          maxWidth="900px"
          aspectRatio={"1920/1084"}
          borderRadius="lg"
          boxShadow="lg"
          mt={0}
          bg="#1D0838"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={10}
          >
            {renderGameState()}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default Game 