import { Box, Heading, Text, VStack } from '@chakra-ui/react';

const TermsAndConditions = () => (
  <Box maxW="800px" mx="auto" p={8} bg="gray.900" borderRadius="lg" color="gray.100" mt={8} mb={8} boxShadow="xl">
    <Heading as="h1" size="xl" mb={6} color="yellow.300">Terms and Conditions</Heading>
    <VStack align="start" spacing={4} fontSize="md">
      <Text><b>1. Gameplay</b><br />Whack-A-Monkey is a skill-based web game. Players compete for high scores and can win prizes from the prize pool.</Text>
      <Text><b>2. Payments and Prizes</b><br />To play, users must pay the buy-in fee in APE tokens. A portion of each buy-in funds the prize pool. The player with the highest score at the end of each round may claim the prize pool, minus protocol fees and buffer.</Text>
      <Text><b>3. Score Validation</b><br />All scores are validated using cryptographic signatures and nonce-based security. Attempts to cheat, replay, or manipulate scores will result in disqualification.</Text>
      <Text><b>4. Prize Claiming</b><br />Prizes must be claimed within the session window. Expired or invalid claims will not be honored. The contract and backend enforce all claim rules.</Text>
      <Text><b>5. Protocol Fees and Buffer</b><br />A protocol fee is deducted from each game. A buffer is maintained to ensure future prize payouts and game sustainability.</Text>
      <Text><b>6. Refunds</b><br />All payments are final. No refunds will be issued for any reason, including technical issues, disconnections, or user error.</Text>
      <Text><b>7. Eligibility</b><br />Players must comply with all applicable laws and regulations. The game is not available in jurisdictions where such games are prohibited.</Text>
      <Text><b>8. Intellectual Property</b><br />All game content, branding, and assets are the property of Mister Monkee Labs. The software code is open source under the MIT license, but game content and branding are proprietary.</Text>
      <Text><b>9. Disclaimers</b><br />Whack-A-Monkey is provided "as is" without warranties of any kind. Mister Monkee Labs is not responsible for lost funds, technical issues, or any damages arising from use of the game.</Text>
      <Text><b>10. Dispute Resolution</b><br />Any disputes will be resolved at the sole discretion of Mister Monkee Labs. All decisions are final.</Text>
      <Text><b>11. Changes</b><br />These terms may be updated at any time. Continued use of the game constitutes acceptance of the latest terms.</Text>
      <Text mt={6} color="gray.400" fontSize="sm">Last updated: 2025</Text>
    </VStack>
  </Box>
);

export default TermsAndConditions; 