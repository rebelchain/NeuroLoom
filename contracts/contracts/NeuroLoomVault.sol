// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

interface IPancakeRouter02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IChainlinkAggregator {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    // Tambahan interface untuk mengambil desimal Oracle
    function decimals() external view returns (uint8); 
}

contract NeuroLoomVault is 
    Initializable, 
    ERC4626Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant AI_EXECUTOR_ROLE = keccak256("AI_EXECUTOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IPancakeRouter02 public dexRouter;
    IChainlinkAggregator public priceFeed; // Legacy: Will be replaced by Multi-Oracle System on V2

    error SlippageExceeded();
    error UnauthorizedAI();
    error StaleOracleData();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IERC20 _asset, 
        address defaultAdmin, 
        address aiExecutor,
        address _dexRouter,
        address _priceFeed
    ) initializer public {
        __ERC4626_init(_asset);
        __ERC20_init("NeuroLoom Vault Share", "nlUSDT");
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
        _grantRole(AI_EXECUTOR_ROLE, aiExecutor);

        dexRouter = IPancakeRouter02(_dexRouter);
        priceFeed = IChainlinkAggregator(_priceFeed);
    }


    function executeRebalance(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    ) external virtual onlyRole(AI_EXECUTOR_ROLE) whenNotPaused {
        _validateSlippageAgainstOracle(path[0], path[path.length - 1], amountIn, amountOutMin);
        IERC20(path[0]).forceApprove(address(dexRouter), amountIn);
        dexRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 
        );
    }

    function _validateSlippageAgainstOracle(
        address /* tokenIn */, 
        address /* tokenOut */, 
        uint256 /* amountIn */, 
        uint256 /* amountOutMin */
    ) internal view virtual {
        (
            /* uint80 roundID */,
            int256 price,
            /* uint startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();

        if (block.timestamp - updatedAt > 3600) revert StaleOracleData();
        require(price > 0, "Invalid Oracle Price");
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}