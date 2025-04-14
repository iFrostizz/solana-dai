import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Program, web3,  } from "@coral-xyz/anchor";
import { SolanaDai } from "../target/types/solana_dai";
import { BN } from "bn.js";

describe("solana-dai", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const signer = web3.Keypair.generate();
  const program = anchor.workspace.solanaDai as Program<SolanaDai>;

  const [configPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("CONFIG")],
    program.programId
  );

  const [authorityPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("MINT_AUTHORITY")],
    program.programId
  );

  const [mintPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("MINT")],
    program.programId
  );

  before(async () => {
    const tx = await connection.requestAirdrop(signer.publicKey, 10 * web3.LAMPORTS_PER_SOL);
    await connection.confirmTransaction({signature: tx, ...(await connection.getLatestBlockhash())});
  })

  it("initializes config with correct data", async () => {
    const liquidationThreshold = new BN(12_000); // example value, 120%

    await program.methods
      .initialize(liquidationThreshold)
      .accounts({
        signer: signer.publicKey,
        configPda,
        authorityPda,
        mintPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    const configAccount = await program.account.config.fetch(configPda);
    expect(configAccount.liquidationThreshold.toString()).to.equal(liquidationThreshold.toString());
    
    const mintAccount = await connection.getAccountInfo(mintPda);
  });

});
