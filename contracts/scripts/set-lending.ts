import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

import VaultArtifact from "../artifacts/contracts/NeuroLoomVault.sol/NeuroLoomVault.json" with { type: "json" };

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";
const PROXY_ADDRESS =
  "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a" as `0x${string}`; // The Yield Farm
const VENUS_VUSDT =
  "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" as `0x${string}`;

async function setLendingWhitelist() {
  console.log("registered as a lendoing protocol");

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("no private key");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(RPC_URL),
  });

  try {
    const { request } = await publicClient.simulateContract({
      account,
      address: PROXY_ADDRESS,
      abi: VaultArtifact.abi,
      functionName: "setLendingProtocol",
      args: [VENUS_VUSDT, true],
    });

    const hash = await walletClient.writeContract(request);
    console.log(` TxHash: ${hash}`);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      `Venus Protocol (${VENUS_VUSDT}) berhasil dikecualikan dari Oracle!`,
    );
  } catch (error: any) {
    console.error(
      "Gagal mendaftarkan Venus:",
      error.shortMessage || error.message,
    );
  }
}

setLendingWhitelist();
