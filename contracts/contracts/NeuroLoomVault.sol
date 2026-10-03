// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IChainlinkAggregator {
    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

interface IVenusToken {
    function exchangeRateStored() external view returns (uint256);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function mint(MintParams calldata params) external payable returns (
        uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1
    );
    function decreaseLiquidity(DecreaseLiquidityParams calldata params) external payable returns (uint256 amount0, uint256 amount1);
    function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);
    function burn(uint256 tokenId) external payable;
    function positions(uint256 tokenId) external view returns (
        uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower,
        int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128,
        uint128 tokensOwed0, uint128 tokensOwed1
    );
}

/**
 * @title NeuroLoomVault (Multi-Strategy Edition - OZ v5)
 */
contract NeuroLoomVault is 
    Initializable, 
    ERC4626Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuard, 
    UUPSUpgradeable,
    IERC721Receiver 
{
    using SafeERC20 for IERC20;

    bytes32 public constant AI_EXECUTOR_ROLE = keccak256("AI_EXECUTOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    uint256 public constant MAX_SLIPPAGE_BPS = 200; // 2%
    uint256 public constant MAX_DEPLOYABLE_BPS = 9000; // 90% 
    uint256 public constant MAX_VELOCITY_BPS = 2000; // 20% 

    address public wbnbToken;
    address public venusVToken; 
    INonfungiblePositionManager public nftPositionManager;

    uint256 public lpDeployedPrincipal;
    uint256 public highestVenusExchangeRate; 

    mapping(address => bool) public approvedProtocols;
    mapping(address => mapping(address => address)) public pairPriceFeeds;
    mapping(address => bool) public isLendingProtocol;

    event RebalanceExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 timestamp);
    event ProtocolApproved(address indexed protocol, bool status);

    error SlippageExceeded();
    error UnauthorizedAI();
    error StaleOracleData();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _defaultAdmin,
        address _aiExecutor
    ) initializer public {
        __ERC4626_init(_asset);
        __ERC20_init(_name, _symbol);
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(UPGRADER_ROLE, _defaultAdmin);
        _grantRole(AI_EXECUTOR_ROLE, _aiExecutor);
    }

    function setApprovedProtocol(address protocol, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(protocol != address(0), "Invalid address");
        approvedProtocols[protocol] = status;
        emit ProtocolApproved(protocol, status);
    }

    function setPairPriceFeed(address tokenIn, address tokenOut, address feed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feed != address(0), "Invalid feed address");
        pairPriceFeeds[tokenIn][tokenOut] = feed;
    }

    function setLendingProtocol(address protocol, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(protocol != address(0), "Invalid address");
        isLendingProtocol[protocol] = status;
    }

    function setWbnbToken(address _wbnbToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        wbnbToken = _wbnbToken;
    }

    function setVenusVToken(address _venusVToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        venusVToken = _venusVToken;
    }

    function setNftPositionManager(address _manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        nftPositionManager = INonfungiblePositionManager(_manager);
    }

    function executeOmnichain(
        address targetProtocol,
        bytes calldata data,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOutMin
    ) external nonReentrant onlyRole(AI_EXECUTOR_ROLE) whenNotPaused {
        require(amountIn > 0, "Amount must be > 0");
        require(approvedProtocols[targetProtocol], "Protocol not approved");

        uint256 currentTvl = totalAssets();

        require(amountIn <= (currentTvl * MAX_VELOCITY_BPS) / 10000, "VelocityGuard: Amount exceeds 20% per TX");

 
        if (tokenIn == asset()) {
            uint256 currentIdleUsdt = IERC20(asset()).balanceOf(address(this));
            uint256 alreadyDeployedUsdt = currentTvl - currentIdleUsdt;
            require(alreadyDeployedUsdt + amountIn <= (currentTvl * MAX_DEPLOYABLE_BPS) / 10000, "NeuroLoomGuard: Exceeds 90% deployment cap");
        }

    
        if (isLendingProtocol[targetProtocol] && venusVToken != address(0)) {
            uint256 currentRate = IVenusToken(venusVToken).exchangeRateStored();
            require(currentRate >= highestVenusExchangeRate, "RateGuard: Venus Depeg Detected");
            if (currentRate > highestVenusExchangeRate) {
                highestVenusExchangeRate = currentRate;
            }
        } else {
            _validateSlippageAgainstOracle(tokenIn, tokenOut, amountIn, expectedAmountOutMin);
        }

        IERC20(tokenIn).forceApprove(targetProtocol, amountIn);
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));

        (bool success, ) = targetProtocol.call(data);
        require(success, "Transaction reverted at target protocol");

        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require((balanceAfter - balanceBefore) >= expectedAmountOutMin, "Fatal: Post-execution slippage detected");

        emit RebalanceExecuted(tokenIn, tokenOut, amountIn, block.timestamp);
    }

  /**
     * @dev OVERRIDE CRITICAL: Calculate real Net Asset Value
     */
    function totalAssets() public view virtual override returns (uint256) {
        uint256 idleCash = IERC20(asset()).balanceOf(address(this));

        uint256 venusValue = 0;
        if (venusVToken != address(0)) {
            uint256 vBalance = IERC20(venusVToken).balanceOf(address(this));
            if (vBalance > 0) {
                uint256 exchangeRate = IVenusToken(venusVToken).exchangeRateStored();
                venusValue = (vBalance * exchangeRate) / 1e18;
            }
        }

        return idleCash + venusValue + lpDeployedPrincipal;
    }
    /**
     * @dev Cap maximum withdraw/redeem to idle cash to prevent revert 
     * when funds are deployed in external protocols.
     */
    function maxWithdraw(address owner) public view virtual override returns (uint256) {
        uint256 idleCash = IERC20(asset()).balanceOf(address(this));
        uint256 standardMax = super.maxWithdraw(owner);
        return idleCash < standardMax ? idleCash : standardMax;
    }

    function maxRedeem(address owner) public view virtual override returns (uint256) {
        uint256 idleCash = IERC20(asset()).balanceOf(address(this));
        uint256 standardMaxRedeem = super.maxRedeem(owner);
        uint256 idleShares = convertToShares(idleCash);
        return idleShares < standardMaxRedeem ? idleShares : standardMaxRedeem;
    }

    function _validateSlippageAgainstOracle(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 amountOutMin 
    ) internal view { 
        address feedAddress = pairPriceFeeds[tokenIn][tokenOut];
        require(feedAddress != address(0), "No oracle feed configured for this pair");

        IChainlinkAggregator feed = IChainlinkAggregator(feedAddress);
        ( , int256 price, , uint256 updatedAt, ) = feed.latestRoundData();

        if (block.timestamp - updatedAt > 3600) revert StaleOracleData();
        require(price > 0, "Invalid Oracle Price");

        uint8 tokenInDecimals = IERC20Metadata(tokenIn).decimals();
        uint8 tokenOutDecimals = IERC20Metadata(tokenOut).decimals();
        uint8 feedDecimals = feed.decimals(); 

        uint256 expectedAmountOut;

        if (tokenOut == wbnbToken) {
            expectedAmountOut = (amountIn * (10 ** tokenOutDecimals) * (10 ** feedDecimals)) / 
                                (uint256(price) * (10 ** tokenInDecimals));
        } else {
            expectedAmountOut = (amountIn * uint256(price) * (10 ** tokenOutDecimals)) / 
                                ((10 ** tokenInDecimals) * (10 ** feedDecimals));
        }

        uint256 minimumAcceptableAmount = (expectedAmountOut * (10000 - MAX_SLIPPAGE_BPS)) / 10000;
        require(amountOutMin >= minimumAcceptableAmount, "Slippage tolerance exceeded Oracle bounds");
    }

   /**
     * @dev Liquidity Position (ERC-721) PancakeSwap V3.
     */
    function executeLiquidityProvision(
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) external nonReentrant onlyRole(AI_EXECUTOR_ROLE) whenNotPaused returns (uint256 tokenId) {
        require(address(nftPositionManager) != address(0), "Manager V3 not configured");
        
        IERC20(token0).forceApprove(address(nftPositionManager), amount0Desired);
        IERC20(token1).forceApprove(address(nftPositionManager), amount1Desired);

        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            recipient: address(this), 
            deadline: block.timestamp + 300
        });

        uint256 amount0;
        uint256 amount1;
        
        (tokenId, , amount0, amount1) = nftPositionManager.mint(params);

        if (token0 == asset()) lpDeployedPrincipal += amount0;
        if (token1 == asset()) lpDeployedPrincipal += amount1;
    }

    /**
     * @dev close position LP
     */
    function closeLPPosition(uint256 tokenId) external nonReentrant onlyRole(AI_EXECUTOR_ROLE) whenNotPaused {
        //  get current position from NFT
        (,,,,,,, uint128 liquidity,,,,) = nftPositionManager.positions(tokenId);
        require(liquidity > 0, "No liquidity in this NFT");

        // cabut liquidity
        nftPositionManager.decreaseLiquidity(INonfungiblePositionManager.DecreaseLiquidityParams({
            tokenId: tokenId,
            liquidity: liquidity,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp + 300
        }));

        // get pokok token + trading fee
        nftPositionManager.collect(INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        }));

        // burn nft
        nftPositionManager.burn(tokenId);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}