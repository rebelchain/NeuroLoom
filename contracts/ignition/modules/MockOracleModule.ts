import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockOracleModule", (m) => {
  const decimals = 8;

  const initialPrice = "100000000";

  const mockOracle = m.contract("MockChainlinkOracle", [
    decimals,
    initialPrice,
  ]);

  return { mockOracle };
});
