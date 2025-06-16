import { BigInt } from '@graphprotocol/graph-ts'
import {
  HighScoreUpdated,
  PrizeClaimed
} from '../generated/WhackAMonkey/WhackAMonkey'
import {
  HighScore,
  PrizeClaim
} from '../generated/schema'

export function handleHighScoreUpdated(event: HighScoreUpdated): void {
  let highScore = new HighScore(event.transaction.hash.toHexString())
  highScore.score = event.params.newHighScore
  highScore.holder = event.params.player
  highScore.timestamp = event.params.timestamp
  highScore.save()
}

export function handlePrizeClaimed(event: PrizeClaimed): void {
  let claim = new PrizeClaim(event.transaction.hash.toHexString())
  claim.winner = event.params.winner
  claim.amount = event.params.amount
  claim.timestamp = event.block.timestamp
  // If you want to store the score, you may need to pass it in the event or look it up
  claim.score = BigInt.zero() // Placeholder, update if score is available in event
  claim.save()
} 