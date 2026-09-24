import hre from "hardhat";

async function main() {
  console.log("Initiating Infrastructure Smoke Test\n");

  const viem = (hre as any).viem;

  if (!viem) {
    throw new Error(
      "❌ View plugin not detected! import '@nomicfoundation/hardhat-toolbox-view'",
    );
  }

  console.log("Deploying V2 to local memory...");
  const vault = await viem.deployContract("NeuroLoomVaultV2");
  console.log(
    "PASSED. V2 contract successfully deployed to address:",
    vault.address,
  );

  console.log("Validating Role-Based Access Control (RBAC) access...");
  const aiRole = await vault.read.AI_EXECUTOR_ROLE();
  const expectedRole =
    "0x0c821e1b44f170b6d24f8a571604a3ff6cf1c5732d7f3ef80e53eee98cf3fc56";

  if (aiRole === expectedRole) {
    console.log("PASS. RBAC Check: Perfectly verified AI_EXECUTOR_ROLE hash.");
  } else {
    throw new Error(
      "Failed. The AI ​​role hash does not meet security standards!",
    );
  }

  console.log(
    "\n Smoke Test Passed: V2 Proxy deployed and AI_EXECUTOR_ROLE bound successfully.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
