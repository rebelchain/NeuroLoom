TITLE: High severity — lpDeployedPrincipal never decremented in closeLPPosition causes totalAssets() inflation and unfair share pricing

SUMMARY:

The NeuroLoomVault contract increments lpDeployedPrincipal when LP positions are opened in executeLiquidityProvision, but never decrements it when positions are closed in closeLPPosition. This causes totalAssets() to double-count the LP principal after a position is closed, inflating the reported NAV and corrupting the ERC-4626 share pricing mechanism.

---
AFFECTED CODE:

File: contracts/contracts/NeuroLoomVault.sol

Increment (executeLiquidityProvision, lines 308-309):
  if (token0 == asset()) lpDeployedPrincipal += amount0;
  if (token1 == asset()) lpDeployedPrincipal += amount1;

Missing decrement (closeLPPosition, lines 315-339):
  The function calls decreaseLiquidity, collect, and burn on the NFT
  position manager. Collected tokens return to the vault's idle balance.
  However, lpDeployedPrincipal is never reduced. The function does not
  reference this variable at all.

Impact on totalAssets (lines 206-219):
  return idleCash + venusValue + lpDeployedPrincipal;

After a position is closed, the collected tokens are counted twice:
once in idleCash (because they are back in the vault) and once in
lpDeployedPrincipal (because it was never decremented).

---

PROOF OF CONCEPT:

A Foundry test suite (2 tests, both passing) demonstrates the bug with
concrete numbers. The test deploys the actual NeuroLoomVault behind an
ERC1967 proxy, initializes it, and simulates a full LP open and close cycle.

Test 1 — test_PoC_LPPrincipalNeverDecremented:
  Alice deposits 1000 USDT.
  AI executor opens LP with 500 USDT.
  At this point accounting is correct: 500 idle + 500 lpPrincipal = 1000.
  LP is closed, 500 USDT returns to vault.
  totalAssets() now reports 1500 instead of the correct 1000.
  Actual USDT balance in vault: 1000.

  Impact demonstrated:
  - Price per share inflated from 1.0 to ~1.5
  - Bob depositing 1000 USDT receives only ~666 shares (should be ~1000)
  - Alice redeeming 1000 shares receives ~1500 USDT (should be ~1000)
  - Alice extracts 500 USDT that belongs to Bob

Test 2 — test_PoC_BugCompoundsWithMultipleCycles:
  After 3 open/close cycles, totalAssets() reports 2500 while only
  1000 USDT actually exists. The phantom value grows linearly with
  each LP cycle.

---

IMPACT:

Severity: High

This bug causes direct loss of funds for depositors. The inflated
totalAssets corrupts ERC-4626 share pricing. Early withdrawers can
redeem their shares for more assets than they are entitled to, draining
the vault at the expense of remaining holders. In the worst case, the
last holders to withdraw cannot redeem at all because the vault does
not hold enough tokens to cover the inflated share price.

The bug is triggered through normal protocol operation. The AI executor
is expected to open and close LP positions as part of its yield
optimization strategy. Every close operation permanently inflates the
phantom lpDeployedPrincipal. The bug compounds over time.

No special access is needed to exploit this. An attacker only needs to
deposit before the inflation occurs and withdraw after.

---

REMEDIATION:

Option A (minimal fix):
  In closeLPPosition, capture the amounts returned by collect and
  decrement lpDeployedPrincipal by the accounting asset portion.

Option B (robust fix):
  Track LP positions by tokenId in a mapping, storing the principal
  amount for each position. When closeLPPosition is called, look up
  the stored principal for that tokenId and subtract it from
  lpDeployedPrincipal. This prevents drift between tracked and actual
  deployed amounts.

Option C (safety net):
  Add a reconciliation function that compares lpDeployedPrincipal
  against actual token balances held by the NFT position manager on
  behalf of the vault, and corrects any discrepancy.

---

ENVIRONMENT:

  Solidity: 0.8.28
  Foundry: v1.8.6
  EVM: cancun
  OpenZeppelin: v5.4.0
  Network: BSC Testnet (Chain ID 97)

---

RESEARCHER:

  Found via manual code audit of github.com/rebelchain/NeuroLoom
  Date: October 27, 2026
  PoC: Foundry test suite, 2/2 passing, available on request
