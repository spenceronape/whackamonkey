import { useState, useEffect } from 'react'
import { Box, VStack, HStack, Text, Button, Input, Heading, useToast } from '@chakra-ui/react'
import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import WHACK_A_MONKEY_ABI from './WhackAMonkeyABI.json'
import { WHACK_A_MONKEY_ADDRESS } from './contractAddress'
import { Contract } from 'ethers'

const AdminPanel = () => {
  const [contract, setContract] = useState<Contract | null>(null)
  const [readContract, setReadContract] = useState<Contract | null>(null)
  const [gameCost, setGameCost] = useState<string>('')
  const [protocolFee, setProtocolFee] = useState<string>('')
  const [currentGameCost, setCurrentGameCost] = useState<string>('')
  const [currentProtocolFee, setCurrentProtocolFee] = useState<string>('')
  const [currentProtocolFees, setCurrentProtocolFees] = useState<string>('')
  const [currentPrizePoolShare, setCurrentPrizePoolShare] = useState<string>('')
  const [prizePoolShare, setPrizePoolShare] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const toast = useToast()

  // Admin wallet address
  const ADMIN_WALLET_ADDRESS = '0x4d6f6f4ef5e5f74074Ad0798CE44436491750A2E'

  // Initialize contracts
  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.providers.Web3Provider(walletClient as any)
      const signer = provider.getSigner()
      const contractInstance = new Contract(WHACK_A_MONKEY_ADDRESS, WHACK_A_MONKEY_ABI, signer)
      const readContractInstance = new Contract(WHACK_A_MONKEY_ADDRESS, WHACK_A_MONKEY_ABI, provider)
      setContract(contractInstance)
      setReadContract(readContractInstance)
    }
  }, [walletClient])

  // Check admin access and fetch current values
  useEffect(() => {
    const fetchData = async () => {
      if (readContract && address) {
        try {
          const cost = await (readContract as any).gameCost()
          const fee = await (readContract as any).protocolFee()
          const fees = await (readContract as any).getProtocolFees()
          const share = await (readContract as any).prizePoolShare()
          
          setCurrentGameCost(ethers.utils.formatEther(cost))
          setCurrentProtocolFee(ethers.utils.formatEther(fee))
          setCurrentProtocolFees(ethers.utils.formatEther(fees))
          setCurrentPrizePoolShare(ethers.utils.formatEther(share.mul(100))) // Convert to percentage
          
          // Check if current wallet is the admin wallet
          const isAdminWallet = address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()
          
          if (isAdminWallet) {
            // Check if admin wallet is an operator
            const isOperator = await (readContract as any).isOperator(ADMIN_WALLET_ADDRESS)
            setIsAdmin(isOperator)
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          console.error('Error fetching contract data:', error)
        }
      }
    }
    fetchData()
  }, [readContract, address])

  const handleUpdateGameCost = async () => {
    if (!contract || !gameCost) return
    
    setLoading(true)
    try {
      const costWei = ethers.utils.parseEther(gameCost)
      const tx = await (contract as any).setGameCost(costWei)
      await tx.wait()
      
      toast({
        title: 'Success',
        description: `Game cost updated to ${gameCost} APE`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      setGameCost('')
      // Refresh current values
      const cost = await (readContract as any).gameCost()
      setCurrentGameCost(ethers.utils.formatEther(cost))
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update game cost',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProtocolFee = async () => {
    if (!contract || !protocolFee) return
    
    setLoading(true)
    try {
      const feeWei = ethers.utils.parseEther(protocolFee)
      const tx = await (contract as any).setProtocolFee(feeWei)
      await tx.wait()
      
      toast({
        title: 'Success',
        description: `Protocol fee updated to ${protocolFee} APE`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      setProtocolFee('')
      // Refresh current values
      const fee = await (readContract as any).protocolFee()
      setCurrentProtocolFee(ethers.utils.formatEther(fee))
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update protocol fee',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrizePoolShare = async () => {
    if (!contract || !prizePoolShare) return
    
    setLoading(true)
    try {
      const sharePercentage = parseFloat(prizePoolShare) / 100
      const shareWei = ethers.utils.parseEther(sharePercentage.toString())
      const tx = await (contract as any).setPrizePoolShare(shareWei)
      await tx.wait()
      
      toast({
        title: 'Success',
        description: `Prize pool share updated to ${prizePoolShare}%`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      setPrizePoolShare('')
      // Refresh current values
      const share = await (readContract as any).prizePoolShare()
      setCurrentPrizePoolShare(ethers.utils.formatEther(share.mul(100)))
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update prize pool share',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawProtocolFees = async () => {
    if (!contract) return
    
    setWithdrawing(true)
    try {
      const tx = await (contract as any).withdrawProtocolFees()
      await tx.wait()
      
      toast({
        title: 'Success',
        description: `Protocol fees withdrawn: ${currentProtocolFees} APE`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      // Refresh current values
      const fees = await (readContract as any).getProtocolFees()
      setCurrentProtocolFees(ethers.utils.formatEther(fees))
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to withdraw protocol fees',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setWithdrawing(false)
    }
  }

  if (!isAdmin) {
    return (
      <Box p={6} bg="gray.800" borderRadius="md" maxW="600px" mx="auto" mt={8}>
        <Text color="red.400" textAlign="center" mb={2}>
          Access Denied: Only the admin wallet can access this panel.
        </Text>
        <Text color="gray.400" textAlign="center" fontSize="sm">
          Admin wallet: {ADMIN_WALLET_ADDRESS}
        </Text>
        <Text color="yellow.400" textAlign="center" fontSize="sm" mt={2}>
          Note: The admin wallet must be added as an operator by the contract owner to make changes.
        </Text>
        <Text color="blue.400" textAlign="center" fontSize="sm" mt={1}>
          Current wallet: {address || 'Not connected'}
        </Text>
      </Box>
    )
  }

  return (
    <Box p={6} bg="gray.800" borderRadius="md" maxW="600px" mx="auto" mt={8}>
      <Heading size="lg" mb={6} color="yellow.400" textAlign="center">
        🎮 Admin Panel
      </Heading>
      
      <VStack spacing={6} align="stretch">
        {/* Current Values */}
        <Box p={4} bg="gray.700" borderRadius="md">
          <Text fontWeight="bold" color="yellow.400" mb={3}>Current Values:</Text>
          <HStack justify="space-between">
            <Text color="gray.300">Game Cost:</Text>
            <Text color="green.400" fontWeight="bold">{currentGameCost} APE</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.300">Protocol Fee:</Text>
            <Text color="blue.400" fontWeight="bold">{currentProtocolFee} APE</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.300">Prize Pool Share:</Text>
            <Text color="orange.400" fontWeight="bold">{currentPrizePoolShare}%</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.300">Accumulated Fees:</Text>
            <Text color="purple.400" fontWeight="bold">{currentProtocolFees} APE</Text>
          </HStack>
        </Box>

        {/* Withdraw Protocol Fees */}
        <Box p={4} bg="gray.700" borderRadius="md">
          <Text fontWeight="bold" color="yellow.400" mb={3}>Withdraw Protocol Fees:</Text>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text color="gray.300" fontSize="sm">Available to withdraw:</Text>
              <Text color="purple.400" fontWeight="bold" fontSize="lg">{currentProtocolFees} APE</Text>
            </VStack>
            <Button
              colorScheme="purple"
              onClick={handleWithdrawProtocolFees}
              isLoading={withdrawing}
              isDisabled={parseFloat(currentProtocolFees) <= 0}
            >
              {withdrawing ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </HStack>
        </Box>

        {/* Update Game Cost */}
        <Box p={4} bg="gray.700" borderRadius="md">
          <Text fontWeight="bold" color="yellow.400" mb={3}>Update Game Cost:</Text>
          <HStack>
            <Input
              placeholder="New game cost (APE)"
              value={gameCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGameCost(e.target.value)}
              type="number"
              step="0.1"
              min="0"
            />
            <Button
              colorScheme="yellow"
              onClick={handleUpdateGameCost}
              isLoading={loading}
              isDisabled={!gameCost}
            >
              Update
            </Button>
          </HStack>
        </Box>

        {/* Update Protocol Fee */}
        <Box p={4} bg="gray.700" borderRadius="md">
          <Text fontWeight="bold" color="yellow.400" mb={3}>Update Protocol Fee:</Text>
          <HStack>
            <Input
              placeholder="New protocol fee (APE)"
              value={protocolFee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProtocolFee(e.target.value)}
              type="number"
              step="0.1"
              min="0"
            />
            <Button
              colorScheme="blue"
              onClick={handleUpdateProtocolFee}
              isLoading={loading}
              isDisabled={!protocolFee}
            >
              Update
            </Button>
          </HStack>
        </Box>

        {/* Update Prize Pool Share */}
        <Box p={4} bg="gray.700" borderRadius="md">
          <Text fontWeight="bold" color="yellow.400" mb={3}>Update Prize Pool Share:</Text>
          <HStack>
            <Input
              placeholder="New prize pool share (%)"
              value={prizePoolShare}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrizePoolShare(e.target.value)}
              type="number"
              step="0.1"
              min="0"
              max="100"
            />
            <Button
              colorScheme="green"
              onClick={handleUpdatePrizePoolShare}
              isLoading={loading}
              isDisabled={!prizePoolShare}
            >
              Update
            </Button>
          </HStack>
        </Box>

        <Text fontSize="sm" color="gray.400" textAlign="center">
          ⚠️ Changes take effect immediately. Make sure the protocol fee doesn't exceed the game cost.
        </Text>
      </VStack>
    </Box>
  )
}

export default AdminPanel 