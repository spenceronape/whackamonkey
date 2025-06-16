import { Box, Container, Text, Link, HStack } from '@chakra-ui/react'

const Footer = () => {
  return (
    <Box as="footer" py={4} borderTop="1px" borderColor="purple.700">
      <Container maxW="container.xl">
        <HStack justify="space-between" align="center">
          <Text color="white">© 2024 Whack-A-Monkey</Text>
          <HStack spacing={4}>
            <Link href="https://github.com/spenceronape/whackamonkey" isExternal color="white">
              GitHub
            </Link>
            <Link href="https://twitter.com/WhackAMonkey" isExternal color="white">
              Twitter
            </Link>
          </HStack>
        </HStack>
      </Container>
    </Box>
  )
}

export default Footer 