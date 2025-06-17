const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cm8grmwci3q4001w1e6mz7wzu/subgraphs/whack-a-monkey/1.0.1/gn';

export interface GamePlayed {
  id: string;
  player: string;
  score: string;
  timestamp: string;
  gameCost: string;
  protocolFee: string;
  prizePoolShare: string;
}

export interface PrizeClaim {
  id: string;
  winner: string;
  amount: string;
  score: string;
  timestamp: string;
}

export interface HighScore {
  id: string;
  score: string;
  holder: string;
  timestamp: string;
}

export interface ConfigUpdated {
  id: string;
  parameter: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  updatedBy: string;
}

export interface GameStats {
  totalGamesPlayed: number;
  totalPrizePool: string;
  currentHighScore: string;
  currentHighScoreHolder: string;
  protocolFees: string;
  recentGames: GamePlayed[];
  recentClaims: PrizeClaim[];
  recentConfigUpdates: ConfigUpdated[];
}

async function querySubgraph(query: string, variables?: any): Promise<any> {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph query failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Subgraph query error:', error);
    throw error;
  }
}

export async function getGameStats(): Promise<GameStats> {
  const query = `
    query {
      gamePlayeds(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        player
        score
        timestamp
        gameCost
        protocolFee
        prizePoolShare
      }
      prizeClaims(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        winner
        amount
        score
        timestamp
      }
      highScores(first: 1, orderBy: timestamp, orderDirection: desc) {
        id
        score
        holder
        timestamp
      }
      configUpdateds(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        parameter
        oldValue
        newValue
        timestamp
        updatedBy
      }
    }
  `;

  const data = await querySubgraph(query);
  
  // Calculate totals
  const totalGamesPlayed = data.gamePlayeds?.length || 0;
  const totalPrizePool = data.prizeClaims?.reduce((sum: number, claim: PrizeClaim) => 
    sum + parseFloat(claim.amount), 0).toString() || '0';
  const protocolFees = data.gamePlayeds?.reduce((sum: number, game: GamePlayed) => 
    sum + parseFloat(game.protocolFee), 0).toString() || '0';
  
  const currentHighScore = data.highScores?.[0]?.score || '0';
  const currentHighScoreHolder = data.highScores?.[0]?.holder || '';

  return {
    totalGamesPlayed,
    totalPrizePool,
    currentHighScore,
    currentHighScoreHolder,
    protocolFees,
    recentGames: data.gamePlayeds || [],
    recentClaims: data.prizeClaims || [],
    recentConfigUpdates: data.configUpdateds || [],
  };
}

export async function getPlayerStats(playerAddress: string): Promise<{
  gamesPlayed: GamePlayed[];
  totalScore: string;
  averageScore: string;
  bestScore: string;
}> {
  const query = `
    query($player: Bytes!) {
      gamePlayeds(where: { player: $player }, orderBy: timestamp, orderDirection: desc) {
        id
        player
        score
        timestamp
        gameCost
        protocolFee
        prizePoolShare
      }
    }
  `;

  const data = await querySubgraph(query, { player: playerAddress });
  const games = data.gamePlayeds || [];
  
  if (games.length === 0) {
    return {
      gamesPlayed: [],
      totalScore: '0',
      averageScore: '0',
      bestScore: '0',
    };
  }

  const totalScore = games.reduce((sum: number, game: GamePlayed) => 
    sum + parseFloat(game.score), 0);
  const averageScore = totalScore / games.length;
  const bestScore = Math.max(...games.map((game: GamePlayed) => parseFloat(game.score)));

  return {
    gamesPlayed: games,
    totalScore: totalScore.toString(),
    averageScore: averageScore.toString(),
    bestScore: bestScore.toString(),
  };
}

export async function getRecentActivity(limit: number = 20): Promise<{
  games: GamePlayed[];
  claims: PrizeClaim[];
  configUpdates: ConfigUpdated[];
}> {
  const query = `
    query($limit: Int!) {
      gamePlayeds(first: $limit, orderBy: timestamp, orderDirection: desc) {
        id
        player
        score
        timestamp
        gameCost
        protocolFee
        prizePoolShare
      }
      prizeClaims(first: $limit, orderBy: timestamp, orderDirection: desc) {
        id
        winner
        amount
        score
        timestamp
      }
      configUpdateds(first: $limit, orderBy: timestamp, orderDirection: desc) {
        id
        parameter
        oldValue
        newValue
        timestamp
        updatedBy
      }
    }
  `;

  const data = await querySubgraph(query, { limit });
  
  return {
    games: data.gamePlayeds || [],
    claims: data.prizeClaims || [],
    configUpdates: data.configUpdateds || [],
  };
} 