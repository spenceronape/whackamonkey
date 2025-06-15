import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, VStack, HStack, Text, Button, Image } from '@chakra-ui/react'
import { useAccount } from 'wagmi'
import { NativeGlyphConnectButton } from '@use-glyph/sdk-react'

// Game constants
const GAME_DURATION = 60 // seconds
const HOLE_COUNT = 12
const MIN_ACTIVE_HOLES = 3
const MAX_ACTIVE_HOLES = 6
const GAME_COST = '2' // APE tokens
const MONKEY_LIFETIME_START = 2000 // ms
const MONKEY_LIFETIME_END = 800 // ms
const CRUSHED_DISPLAY_TIME = 400; // ms

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
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeHoles, setActiveHoles] = useState<ActiveHole[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const { isConnected } = useAccount()

  // Preload sounds
  const hitAudioRefs = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    hitAudioRefs.current = HIT_SOUNDS.map(src => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      return audio;
    });
  }, []);

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
            setGameState('gameOver')
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

  // Cleanup timers on game end
  useEffect(() => {
    if (gameState !== 'playing') {
      activeHoles.forEach(h => h.timer && clearTimeout(h.timer))
      setActiveHoles([])
    }
  }, [gameState])

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setActiveHoles([])
    setHits(0)
    setMisses(0)
  }, [])

  const handleHoleClick = (holeIndex: number) => {
    if (gameState !== 'playing') return
    setActiveHoles(prev => prev.map(h => {
      if (h.index === holeIndex && !h.hit) {
        setScore(s => s + 1)
        setHits(hits => hits + 1)
        if (h.timer) clearTimeout(h.timer)
        // Play random hit sound
        if (hitAudioRefs.current.length > 0) {
          const idx = Math.floor(Math.random() * hitAudioRefs.current.length);
          const audio = hitAudioRefs.current[idx];
          // Restart if already playing
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

  const accuracy = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '100'

  const renderGameBoard = () => {
    return (
      <Box
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
      >
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
              onClick={() => handleHoleClick(hole.index)}
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
          <VStack spacing={4}>
            <Text fontSize="2xl">Welcome to Whack-A-Monkey!</Text>
            <Text>Cost to play: {GAME_COST} APE</Text>
            {!isConnected ? (
              <NativeGlyphConnectButton />
            ) : (
              <Button colorScheme="blue" onClick={startGame}>
                Start Game
              </Button>
            )}
          </VStack>
        )
      case 'playing':
        return (
          <VStack spacing={4}>
            <HStack>
              <Text>Score: {score}</Text>
              <Text>Time Left: {timeLeft}s</Text>
            </HStack>
            <Text>
              Hits: {hits} | Misses: {misses} | Accuracy: {accuracy}%
            </Text>
            {renderGameBoard()}
          </VStack>
        )
      case 'gameOver':
        return (
          <VStack spacing={4}>
            <Text fontSize="2xl">Game Over!</Text>
            <Text>Final Score: {score}</Text>
            <Button colorScheme="blue" onClick={startGame}>
              Play Again
            </Button>
          </VStack>
        )
      case 'winner':
        return (
          <VStack spacing={4}>
            <Text fontSize="2xl">Congratulations!</Text>
            <Text>You've won the prize pool!</Text>
            <Button colorScheme="green">Claim Prize</Button>
            <Button colorScheme="blue" onClick={startGame}>
              Play Again
            </Button>
          </VStack>
        )
    }
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      {renderGameState()}
    </Box>
  )
}

export default Game 