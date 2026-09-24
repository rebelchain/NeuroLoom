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

interface IChainlinkAggregator {
    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

/**
 * @title NeuroLoomVault (Multi-Strategy Edition - OZ v5)
 */
contract NeuroLoomVault is 
    Initializable, 
    ERC4626Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuard, // Tidak perlu versi Upgradeable lagi
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant AI_EXECUTOR_ROLE = keccak256("AI_EXECUTOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public constant MAX_SLIPPAGE_BPS = 200; // 2%

    mapping(address => bool) public approvedProtocols;
    mapping(address => mapping(address => address)) public pairPriceFeeds;

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

        _validateSlippageAgainstOracle(tokenIn, tokenOut, amountIn, expectedAmountOutMin);

        IERC20(tokenIn).forceApprove(targetProtocol, amountIn);
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));

        (bool success, ) = targetProtocol.call(data);
        require(success, "Transaction reverted at target protocol");

        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require((balanceAfter - balanceBefore) >= expectedAmountOutMin, "Fatal: Post-execution slippage detected");

        emit RebalanceExecuted(tokenIn, tokenOut, amountIn, block.timestamp);
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
        address WBNB_TESTNET = 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd; 

        if (tokenOut == WBNB_TESTNET) {
            expectedAmountOut = (amountIn * (10 ** tokenOutDecimals) * (10 ** feedDecimals)) / 
                                (uint256(price) * (10 ** tokenInDecimals));
        } else {
            expectedAmountOut = (amountIn * uint256(price) * (10 ** tokenOutDecimals)) / 
                                ((10 ** tokenInDecimals) * (10 ** feedDecimals));
        }

        uint256 minimumAcceptableAmount = (expectedAmountOut * (10000 - MAX_SLIPPAGE_BPS)) / 10000;
        require(amountOutMin >= minimumAcceptableAmount, "Slippage tolerance exceeded Oracle bounds");
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}