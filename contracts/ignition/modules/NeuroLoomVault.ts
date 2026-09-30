import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UUPSVaultModule = buildModule("UUPSVaultModule", (m) => {
  const deployer = m.getAccount(0);

  const MUSDT_TESTNET = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";

  const vaultImplementation = m.contract("NeuroLoomVault");

  const initData = m.encodeFunctionCall(vaultImplementation, "initialize", [
    MUSDT_TESTNET,
    "NeuroLoom Yield Vault",
    "nlUSDT",
    deployer,
    deployer,
  ]);

  const proxy = m.contract("NeuroLoomProxy", [vaultImplementation, initData]);

  return { vaultImplementation, proxy };
});

export default UUPSVaultModule;
