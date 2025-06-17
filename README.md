# Whack-A-Monkey 🐒

A fun, open-source Web3 arcade game built on ApeChain where players try to whack Mister Monkee as he pops out of holes! Built with React, Wagmi, and Glyph Wallet integration.

---

## 🚀 Live Features
- **Web3-native gameplay** with Glyph Wallet (connect, fund, play, claim prizes)
- **Prize pool**: 2.5 $APE per play (2 $APE to pool, 0.5 $APE protocol fee)
- **High score**: Beat the top score to win 75% of the pool
- **Hall of Fame**: View the last 10 winners, their scores, prizes, and dates (via subgraph)
- **Mobile responsive** UI and improved mobile/desktop balancing
- **Secure backend nonce generation** for score validation (no more frontend nonce generation)
- **Single-use nonces** enforced by both backend and smart contract for replay protection
- **Public subgraph** for analytics and history: [Goldsky Subgraph](https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.0/gn)
- **Open for contributions**: Fork, build, and PR!

---

## 🕹️ Game Rules
- Pay 2.5 $APE to play (2 $APE to prize pool, 0.5 $APE to protocol)
- Game lasts 60 seconds
- Whack Mister Monkee as he pops out of random holes
- Score points for each successful whack (multipliers for streaks)
- Beat the high score to win 75% of the current prize pool!

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Chakra UI, Wagmi, Glyph Wallet
- **Smart Contract**: Solidity, OpenZeppelin, ApeChain native $APE
- **Backend**: Vercel serverless API (for secure nonce generation and signing)
- **Subgraph**: Goldsky (for Hall of Fame, analytics)

---

## 📝 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- ApeChain wallet with $APE tokens

### Installation
```bash
git clone https://github.com/spenceronape/whackamonkey.git
cd whackamonkey
npm install
npm run dev
```

---

## 🧑‍💻 Development
- Main branch: `main` (production/stable)
- Development branch: `development` (feature work, PRs welcome)
- All code is open source and the repository is public.

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to your fork (`git push origin feature/amazing-feature`)
5. Open a Pull Request to the `development` branch

---

## 🔒 Score Validation & Claim Flow
- The backend generates a secure, unique nonce for each score validation request.
- The frontend requests a signature and nonce from the backend, then submits both to the smart contract to claim prizes.
- The smart contract enforces that each (player, nonce) pair can only be used once (prevents replay attacks).
- If a session or nonce error occurs, the frontend will prompt the user to re-validate and retry.

---

## 📊 Subgraph & Hall of Fame
- The Hall of Fame (last 10 winners) is powered by the [Goldsky Subgraph](https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.0/gn).
- You can query the subgraph directly for analytics, history, and more.

---

## 📄 License
MIT License. See LICENSE file for details.

---

## 🙏 Acknowledgments
- Mister Monkee for being the star of the show
- ApeChain for blockchain infrastructure
- Glyph Wallet for seamless Web3 onboarding
- Goldsky for subgraph indexing

---

**Public repo! Fork, build, and PR your ideas!** 