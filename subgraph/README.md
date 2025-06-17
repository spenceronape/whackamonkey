# Whack-A-Monkey Subgraph

This subgraph tracks events from the Whack-A-Monkey smart contract on Ethereum mainnet.

## Features

- Tracks game plays and scores
- Monitors prize claims
- Records configuration updates
- Provides analytics data for admin panel

## Deployment

### Prerequisites

1. Install Graph CLI:
```bash
npm install -g @graphprotocol/graph-cli
```

2. Authenticate with Goldsky:
```bash
graph auth --product hosted-service <GOLDSKY_ACCESS_TOKEN>
```

### Deploy to Goldsky

1. Generate types:
```bash
npm run codegen
```

2. Build the subgraph:
```bash
npm run build
```

3. Deploy to Goldsky:
```bash
npm run deploy
```

## Schema

The subgraph tracks the following entities:

- **GamePlayed**: Records each game played with score and configuration
- **PrizeClaim**: Tracks prize claims with amounts and scores
- **HighScore**: Current and historical high scores
- **ConfigUpdated**: Configuration parameter changes
- **GameStats**: Aggregated game statistics

## Queries

The subgraph provides real-time data for:

- Recent game activity
- Prize distribution
- Configuration changes
- Player statistics
- Protocol fee tracking

## Integration

The frontend admin panel integrates with this subgraph to provide:

- Real-time analytics dashboard
- Recent activity monitoring
- Configuration change tracking
- Player performance metrics

## Endpoint

Live endpoint: `https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.1/gn` 