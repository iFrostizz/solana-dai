import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Program } from "@coral-xyz/anchor";
import { SolanaDai } from "../target/types/solana_dai";
import { BN } from "bn.js";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";

describe("solana-dai", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaDai as Program<SolanaDai>;
  const connection = provider.connection;
  const wallet = new anchor.Wallet(anchor.web3.Keypair.generate());
  
  const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

  // SOL/USD price feed on mainnet-beta
  const SOL_USD_PRICE_FEED = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

  it.skip("test price from Pyth", async () => {
    const solUsdPriceFeedAccount = pythSolanaReceiver
      .getPriceFeedAccountAddress(0, SOL_USD_PRICE_FEED)
      .toBase58();

    console.log("Price Feed: ", solUsdPriceFeedAccount)

    // Call the deposit function with the fetched price
    const tx = await program.methods.deposit(new BN(1)).accounts({
      priceUpdate: solUsdPriceFeedAccount
    }).rpc();

    console.log("Your transaction signature: ", tx);
  });
  
});
