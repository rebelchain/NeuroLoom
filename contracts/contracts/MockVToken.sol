// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockVToken
 * @notice Simulates a Compound/Venus-style vToken for testnet demo.
 */
contract MockVToken is ERC20, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingToken;

    uint256 public storedExchangeRate;
    uint256 public lastUpdateBlock;

    // Yield simulation: rate increase per block
    // Default = 4756 ≈ 5% APY on BSC (3s blocks, ~10.5M blocks/year)
    // 1e18 * 0.05 / 10_512_000 ≈ 4756 per block
    uint256 public yieldPerBlock = 4756;


    event Mint(address indexed minter, uint256 usdtAmount, uint256 tokensMinted);
    event Redeem(address indexed redeemer, uint256 tokensRedeemed, uint256 usdtReturned);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);

  
    constructor(address _underlyingToken)
        ERC20("Mock Venus USDT", "mvUSDT")
        Ownable(msg.sender)
    {
        require(_underlyingToken != address(0), "Invalid underlying");
        underlyingToken  = IERC20(_underlyingToken);
        storedExchangeRate = 1e18;  // 1:1 initially
        lastUpdateBlock    = block.number;
    }


    /**
     * @notice Returns current exchange rate scaled by 1e18.
     * @dev Called by NeuroLoomVault.totalAssets():
     *      venusValue = (vTokenBalance * exchangeRateStored()) / 1e18
     */
    function exchangeRateStored() public view returns (uint256) {
        uint256 blockDelta = block.number - lastUpdateBlock;
        return storedExchangeRate + (blockDelta * yieldPerBlock);
    }

    /**
     * @notice Returns underlying token address.
     * @dev Used by diagnostic scripts to verify compatibility.
     */
    function underlying() external view returns (address) {
        return address(underlyingToken);
    }


    /**
     * @notice Deposit USDT, receive mvUSDT shares.
     * @dev Called by NeuroLoomVault via executeOmnichain:
     *      1. Vault calls USDT.forceApprove(MockVToken, amount)
     *      2. Vault calls MockVToken via calldata: mint(amount)
     *      3. MockVToken pulls USDT from vault, mints mvUSDT to vault
     * @param mintAmount Amount of underlying USDT to deposit (18 dec)
     * @return 0 — Compound/Venus convention: 0 = success
     */
    function mint(uint256 mintAmount) external returns (uint256) {
        require(mintAmount > 0, "MockVToken: amount must be > 0");

        // Pull USDT from caller (NeuroLoomVault)
        underlyingToken.safeTransferFrom(msg.sender, address(this), mintAmount);

        // Calculate mvUSDT to mint: assets * 1e18 / exchangeRate
        // At rate 1e18: tokensToMint == mintAmount (1:1)
        // At rate 1.05e18: tokensToMint < mintAmount (shares worth more)
        uint256 rate = exchangeRateStored();
        uint256 tokensToMint = (mintAmount * 1e18) / rate;
        require(tokensToMint > 0, "MockVToken: computed 0 tokens");

        _mint(msg.sender, tokensToMint);
        _checkpoint();

        emit Mint(msg.sender, mintAmount, tokensToMint);
        return 0; // success
    }

    /**
     * @notice Burn mvUSDT shares, receive USDT proportional to current rate.
     * @dev Called by AI keeper via executeOmnichain before large vault withdrawals.
     * @param redeemTokens Amount of mvUSDT to burn (18 dec)
     * @return 0 — success
     */
    function redeem(uint256 redeemTokens) external returns (uint256) {
        require(redeemTokens > 0, "MockVToken: amount must be > 0");
        require(balanceOf(msg.sender) >= redeemTokens, "MockVToken: insufficient balance");

        uint256 rate = exchangeRateStored();
        uint256 usdtToReturn = (redeemTokens * rate) / 1e18;
        require(
            underlyingToken.balanceOf(address(this)) >= usdtToReturn,
            "MockVToken: insufficient liquidity"
        );

        _burn(msg.sender, redeemTokens);
        underlyingToken.safeTransfer(msg.sender, usdtToReturn);
        _checkpoint();

        emit Redeem(msg.sender, redeemTokens, usdtToReturn);
        return 0;
    }

    /**
     * @notice Burn mvUSDT shares for an exact USDT amount.
     * @dev Alternative to redeem() — easier for AI keeper to specify exact USDT needed.
     * @param redeemAmount Exact USDT amount to receive (18 dec)
     * @return 0 — success
     */
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256) {
        require(redeemAmount > 0, "MockVToken: amount must be > 0");
        require(
            underlyingToken.balanceOf(address(this)) >= redeemAmount,
            "MockVToken: insufficient liquidity"
        );

        uint256 rate = exchangeRateStored();
        uint256 tokensToBurn = (redeemAmount * 1e18) / rate;
        require(balanceOf(msg.sender) >= tokensToBurn, "MockVToken: insufficient shares");

        _burn(msg.sender, tokensToBurn);
        underlyingToken.safeTransfer(msg.sender, redeemAmount);
        _checkpoint();

        emit Redeem(msg.sender, tokensToBurn, redeemAmount);
        return 0;
    }

    /**
     * @notice Seed initial USDT liquidity so redeem() always has funds.
     * @dev Call after deploy with enough USDT to cover expected redemptions.
     */
    function seedLiquidity(uint256 amount) external onlyOwner {
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Override yield rate per block.
     * @param _yieldPerBlock Per-block exchange rate increment (in 1e18 units).
     *        Examples:
     *          4756  = ~5% APY at BSC 3s blocks (realistic)
     *          47560 = ~50% APY (demo: visible in hours)
     *          475600 = ~500% APY (demo: visible in minutes)
     */
    function setYieldPerBlock(uint256 _yieldPerBlock) external onlyOwner {
        _checkpoint(); // lock in current rate before changing increment
        yieldPerBlock = _yieldPerBlock;
    }

    /**
     * @notice Manually set exchange rate (for demo/testing purposes).
     */
    function setExchangeRate(uint256 newRate) external onlyOwner {
        require(newRate >= 1e18, "MockVToken: rate must be >= 1e18");
        emit ExchangeRateUpdated(storedExchangeRate, newRate);
        storedExchangeRate = newRate;
        lastUpdateBlock    = block.number;
    }

    /// @dev Snapshot current accrued rate to storage.
    function _checkpoint() internal {
        storedExchangeRate = exchangeRateStored();
        lastUpdateBlock    = block.number;
    }
}
