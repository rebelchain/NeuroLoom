import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UUPSVaultModule = buildModule("UUPSVaultModule", (m) => {
  const deployer = m.getAccount(0);

 const REAL_USDT_TESTNET = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";
  const PANCAKESWAP_V3_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
  const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";

  const vaultImplementation = m.contract("NeuroLoomVault");

  const initData = m.encodeFunctionCall(vaultImplementation, "initialize", [
    REAL_USDT_TESTNET,
    deployer,
    deployer,
    PANCAKESWAP_V3_ROUTER,
    CHAINLINK_BNB_USD,
  ]);

  const proxy = m.contract("NeuroLoomProxy", [vaultImplementation, initData]);

  return { vaultImplementation, proxy };
});

export default UUPSVaultModule;
