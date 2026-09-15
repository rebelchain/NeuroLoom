import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UUPSVaultModule = buildModule("UUPSVaultModule", (m) => {
  const deployer = m.getAccount(0);

  const MOCK_USDT_ADDRESS = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";
  const PANCAKESWAP_V2_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
  const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";

  const vaultImplementation = m.contract("NeuroLoomVault");

  const initData = m.encodeFunctionCall(vaultImplementation, "initialize", [
    MOCK_USDT_ADDRESS,
    deployer,
    deployer,
    PANCAKESWAP_V2_ROUTER,
    CHAINLINK_BNB_USD,
  ]);

  // [PERUBAHAN DI SINI]: Gunakan NeuroLoomProxy yang baru kita buat
  const proxy = m.contract("NeuroLoomProxy", [vaultImplementation, initData]);

  return { vaultImplementation, proxy };
});

export default UUPSVaultModule;
