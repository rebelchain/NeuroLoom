import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";
// Plugin legacy OpenZeppelin tetap di-import secara side-effect karena belum update ke v3
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      forking: {
        url: "https://api.zan.top/bsc-testnet",
      },
    },
    bscTestnet: {
      type: "http",
      url: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
      chainId: 97,
      accounts: PRIVATE_KEY,
    },
  },
});
