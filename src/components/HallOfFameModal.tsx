import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Spinner, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

interface HallOfFameModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Winner {
  player: string
  score: number
  prizeAmount: string
  timestamp: number
}

const HallOfFameModal = ({ isOpen, onClose }: HallOfFameModalProps) => {
  const [winners, setWinners] = useState<Winner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const response = await fetch('https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.0/gn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              {
                prizeClaimeds(first: 10, orderBy: timestamp, orderDirection: desc) {
                  player
                  score
                  prizeAmount
                  timestamp
                }
              }
            `
          })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error('Failed to fetch winners');
        }
        setWinners(data.data.prizeClaimeds);
      } catch (err) {
        setError('COMING SOON');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchWinners();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="#1D0838" border="2px solid" borderColor="yellow.400">
        <ModalHeader color="yellow.400">Hall of Fame</ModalHeader>
        <ModalCloseButton color="yellow.400" />
        <ModalBody pb={6}>
          {isLoading ? (
            <VStack spacing={4} align="center">
              <Spinner color="yellow.400" />
              <Text color="gray.300">Loading winners...</Text>
            </VStack>
          ) : error ? (
            <VStack spacing={4} align="center">
              <Text color="yellow.400" fontSize="2xl" fontWeight="bold">{error}</Text>
              <Text color="gray.300">Check back soon to see the champions!</Text>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Table variant="simple" colorScheme="yellow">
                <Thead>
                  <Tr>
                    <Th color="yellow.400">Player</Th>
                    <Th color="yellow.400" isNumeric>Score</Th>
                    <Th color="yellow.400" isNumeric>Prize</Th>
                    <Th color="yellow.400">Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {winners.map((winner, index) => (
                    <Tr key={index}>
                      <Td color="gray.300">{`${winner.player.slice(0, 6)}...${winner.player.slice(-4)}`}</Td>
                      <Td color="gray.300" isNumeric>{winner.score}</Td>
                      <Td color="gray.300" isNumeric>{ethers.utils.formatEther(winner.prizeAmount)} $APE</Td>
                      <Td color="gray.300">{new Date(winner.timestamp * 1000).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default HallOfFameModal 