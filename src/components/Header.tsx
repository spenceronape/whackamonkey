import { Box, Container, Heading, HStack, Link, Text } from '@chakra-ui/react'
import { FaTwitter } from 'react-icons/fa'

const Header = () => {
  return (
    <Box as="header" py={4} borderBottom="1px" borderColor="purple.700">
      <Container maxW="container.xl">
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="white">Whack-A-Monkey</Heading>
          <HStack spacing={4}>
            <Link href="https://twitter.com/WhackAMonkey" isExternal>
              <FaTwitter size={24} color="white" />
            </Link>
            <Text color="white">Built on ApeChain</Text>
          </HStack>
        </HStack>
      </Container>
    </Box>
  )
}

export default Header 