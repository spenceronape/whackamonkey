# 🎯 Whack-A-Monkey Wallet Permissions Reference

## 📋 Overview
This document outlines the permissions and abilities of each wallet type in the Whack-A-Monkey game system.

---

## 🔑 Deployment Wallet (Contract Owner)
**Role**: `DEFAULT_ADMIN_ROLE` + `OWNER`
**Description**: The wallet that deploys the contract

### ✅ **Full Control Functions:**
- `setGameActive(bool)` - Enable/disable the game
- `emergencyWithdraw()` - Withdraw all contract funds
- `fundPrizePool()` - Add funds to prize pool
- `addOperator(address)` - Grant operator role to addresses
- `removeOperator(address)` - Revoke operator role
- `setTrustedSigner(address)` - Set backend signer
- `pause()` / `unpause()` - Emergency pause/unpause
- `setMinPrizePoolBuffer(uint256)` - Set minimum buffer
- `rescueTokens(address, uint256, address)` - Rescue stuck tokens
- `transferOwnership(address)` - Transfer ownership

### ❌ **Cannot:**
- Update game costs or protocol fees (operator-only)
- Claim protocol fees (operator-only)

---

## 🎮 Admin Wallet (Operator)
**Role**: `OPERATOR_ROLE` (after being added by owner)

### ✅ **Operational Functions:**
- `setGameCost(uint256)` - Update game entry cost
- `setProtocolFee(uint256)` - Update protocol fee percentage
- `setPrizePoolShare(uint256)` - Update prize pool share percentage
- `withdrawProtocolFees()` - Claim accumulated fees
- `setScoreToBeat(uint256)` - Update minimum score to win

### ❌ **Cannot:**
- Access emergency functions
- Add/remove operators
- Pause/unpause game
- Fund prize pool
- Transfer ownership
- Rescue tokens

---

## 🎯 Player Wallets (Public)
**Role**: Public users

### ✅ **Game Functions:**
- `startGame()` - Pay to play (requires exact game cost)
- `submitScore(uint256, uint256, bytes)` - Submit validated scores
- View functions (prize pool, high scores, etc.)

### ❌ **Cannot:**
- Any administrative functions
- Access to fees or emergency funds

---

## 🔧 Backend Wallet (Trusted Signer)
**Role**: Score validation signer

### ✅ **Backend Functions:**
- Sign score submissions for validation
- Must match `trustedSigner` address in contract

### ❌ **Cannot:**
- Any contract functions (read-only role)

---

## 📊 Permission Matrix

| Function | Owner | Admin | Players | Backend |
|----------|-------|-------|---------|---------|
| Deploy Contract | ✅ | ❌ | ❌ | ❌ |
| Add/Remove Operators | ✅ | ❌ | ❌ | ❌ |
| Update Game Costs | ❌ | ✅ | ❌ | ❌ |
| Update Protocol Fees | ❌ | ✅ | ❌ | ❌ |
| Update Prize Pool Share | ❌ | ✅ | ❌ | ❌ |
| Withdraw Protocol Fees | ❌ | ✅ | ❌ | ❌ |
| Emergency Withdraw | ✅ | ❌ | ❌ | ❌ |
| Pause/Unpause | ✅ | ❌ | ❌ | ❌ |
| Play Game | ❌ | ❌ | ✅ | ❌ |
| Sign Scores | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 Setup Process

### 1. Deploy Contract
Deploy the contract using your deployment wallet.

### 2. Add Admin as Operator
```solidity
// Call from deployment wallet
addOperator()
```

### 3. Set Trusted Signer
```solidity
// Call from deployment wallet
setTrustedSigner(YOUR_BACKEND_WALLET_ADDRESS)
```

### 4. Admin Panel Access
- Connect with admin wallet
- Admin can now:
  - Update costs and fees
  - Withdraw accumulated protocol fees
  - Manage game parameters

---

## 🎮 Game Flow

### Player Experience:
1. Connect wallet (any wallet)
2. Pay game cost (dynamic, set by admin)
3. Play game for 60 seconds
4. Submit score with backend signature
5. Claim prize if score beats threshold

### Admin Experience:
1. Connect admin wallet
2. Access admin panel
3. Update game costs/protocol fees
4. Withdraw accumulated fees
5. Monitor game parameters

### Backend Experience:
1. Receive score validation requests
2. Sign scores with trusted signer wallet
3. Return signature and nonce to frontend

---

## 🔒 Security Features

### Access Control:
- **Role-based permissions** using OpenZeppelin AccessControl
- **Owner-only** for critical functions (emergency, ownership)
- **Operator-only** for operational functions (costs, fees)
- **Public** for game functions

### Validation:
- **Signature verification** for score submissions
- **Nonce system** prevents replay attacks
- **Input validation** on all parameters
- **Balance checks** before transfers

### Emergency Features:
- **Pause/unpause** functionality
- **Emergency withdraw** for owner
- **Token rescue** for stuck ERC20 tokens

---

## 📝 Contract Functions Summary

### Owner Functions:
- `setGameActive(bool)`
- `emergencyWithdraw()`
- `fundPrizePool()`
- `addOperator(address)`
- `removeOperator(address)`
- `setTrustedSigner(address)`
- `pause()`
- `unpause()`
- `setMinPrizePoolBuffer(uint256)`
- `rescueTokens(address, uint256, address)`
- `transferOwnership(address)`

### Operator Functions:
- `setGameCost(uint256)`
- `setProtocolFee(uint256)`
- `setPrizePoolShare(uint256)`
- `withdrawProtocolFees()`
- `setScoreToBeat(uint256)`

### Public Functions:
- `startGame()` (payable)
- `submitScore(uint256, uint256, bytes)`
- View functions (prize pool, high scores, etc.)


---

## 📞 Support

For questions about wallet permissions or setup, refer to this document or contact the development team.

---

*Last Updated: [Current Date]*
*Version: 1.1*