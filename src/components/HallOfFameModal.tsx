import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Spinner } from '@chakra-ui/react'
import { useContractRead } from 'wagmi'
import { WHACK_A_MONKEY_ADDRESS } from './contractAddress'
import WHACK_A_MONKEY_ABI from './WhackAMonkeyABI.json'
import { ethers } from 'ethers'

interface HallOfFameModalProps {
  isOpen: boolean
  onClose: () => void
}

const HallOfFameModal = ({ isOpen, onClose }: HallOfFameModalProps) => {
  const { data: highScore, isLoading: isLoadingScore } = useContractRead({
    address: WHACK_A_MONKEY_ADDRESS,
    abi: WHACK_A_MONKEY_ABI,
    functionName: 'highScore',
  })

  const { data: highScoreHolder, isLoading: isLoadingHolder } = useContractRead({
    address: WHACK_A_MONKEY_ADDRESS,
    abi: WHACK_A_MONKEY_ABI,
    functionName: 'highScoreHolder',
  })

  const { data: prizePool, isLoading: isLoadingPool } = useContractRead({
    address: WHACK_A_MONKEY_ADDRESS,
    abi: WHACK_A_MONKEY_ABI,
    functionName: 'getPrizePool',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="#1D0838" border="2px solid" borderColor="yellow.400">
        <ModalHeader color="yellow.400">Hall of Fame</ModalHeader>
        <ModalCloseButton color="yellow.400" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {isLoadingScore || isLoadingHolder || isLoadingPool ? (
              <Spinner color="yellow.400" />
            ) : (
              <>
                <Text color="gray.300">Current High Score: {highScore?.toString() || '0'}</Text>
                <Text color="gray.300">Holder: {highScoreHolder?.toString() || 'None'}</Text>
                <Text color="gray.300">Prize Pool: {ethers.utils.formatEther(prizePool?.toString() || '0')} $APE</Text>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default HallOfFameModal 