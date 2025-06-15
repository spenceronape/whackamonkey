# Whack-A-Monkey 🐒

A fun Web3 game built on ApeChain where players try to whack Mister Monkee as he pops out of holes! Built with React, Wagmi, and Glyph Wallet integration.

## Game Rules

- Players pay 2 APE to play
- Game lasts 60 seconds
- Mister Monkee pops out of random holes
- Score 1 point for each successful whack
- Match or beat the high score to win 75% of the prize pool!

## Features

- Web3 integration with Glyph Wallet
- Real-time game mechanics
- Prize pool system
- High score tracking
- Recent winners list
- Protocol fee system

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- ApeChain wallet with APE tokens

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whack-a-monkey.git
cd whack-a-monkey
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Smart Contract

The game uses a smart contract deployed on ApeChain (Chain ID: 33139) that handles:
- Game payments
- Prize pool management
- High score tracking
- Protocol fees
- Emergency withdrawals

## Development

### Frontend
- React with TypeScript
- Chakra UI for styling
- Wagmi for Web3 integration
- Glyph Wallet for authentication

### Smart Contract
- Solidity ^0.8.0
- OpenZeppelin contracts
- Events for subgraph indexing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mister Monkee for being the star of the show
- ApeChain for the blockchain infrastructure
- Glyph Wallet for the Web3 integration 