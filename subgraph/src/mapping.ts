import { BigInt } from '@graphprotocol/graph-ts'
import {
  HighScoreUpdated,
  PrizeClaimed,
  GamePlayed,
  GameCostUpdated,
  ProtocolFeeUpdated,
  PrizePoolShareUpdated
} from '../generated/WhackAMonkey/WhackAMonkey'
import {
  HighScore,
  PrizeClaim,
  GamePlayed as GamePlayedEntity,
  ConfigUpdated
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
  claim.score = event.params.score
  claim.timestamp = event.block.timestamp
  claim.save()
}

export function handleGamePlayed(event: GamePlayed): void {
  let gamePlayed = new GamePlayedEntity(event.transaction.hash.toHexString())
  gamePlayed.player = event.params.player
  gamePlayed.score = event.params.score
  gamePlayed.timestamp = event.block.timestamp
  gamePlayed.transactionHash = event.transaction.hash
  gamePlayed.gameCost = event.params.gameCost
  gamePlayed.protocolFee = event.params.protocolFee
  gamePlayed.prizePoolShare = event.params.prizePoolShare
  gamePlayed.save()
}

export function handleGameCostUpdated(event: GameCostUpdated): void {
  let configUpdate = new ConfigUpdated(event.transaction.hash.toHexString())
  configUpdate.parameter = "gameCost"
  configUpdate.oldValue = BigInt.zero() // Would need to track previous value
  configUpdate.newValue = event.params.newCost
  configUpdate.timestamp = event.block.timestamp
  configUpdate.transactionHash = event.transaction.hash
  configUpdate.updatedBy = event.transaction.from
  configUpdate.save()
}

export function handleProtocolFeeUpdated(event: ProtocolFeeUpdated): void {
  let configUpdate = new ConfigUpdated(event.transaction.hash.toHexString())
  configUpdate.parameter = "protocolFee"
  configUpdate.oldValue = BigInt.zero() // Would need to track previous value
  configUpdate.newValue = event.params.newFee
  configUpdate.timestamp = event.block.timestamp
  configUpdate.transactionHash = event.transaction.hash
  configUpdate.updatedBy = event.transaction.from
  configUpdate.save()
}

export function handlePrizePoolShareUpdated(event: PrizePoolShareUpdated): void {
  let configUpdate = new ConfigUpdated(event.transaction.hash.toHexString())
  configUpdate.parameter = "prizePoolShare"
  configUpdate.oldValue = BigInt.zero() // Would need to track previous value
  configUpdate.newValue = event.params.newShare
  configUpdate.timestamp = event.block.timestamp
  configUpdate.transactionHash = event.transaction.hash
  configUpdate.updatedBy = event.transaction.from
  configUpdate.save()
} 