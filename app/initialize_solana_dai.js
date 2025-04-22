// initialize_solana_dai.js

const anchor = require('@coral-xyz/anchor');
const { PublicKey, Connection, Transaction } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// ======= USER CONFIGURATION =======
const DAI_MINT_ADDRESS = '9QZyQH9uEHd8RKm25zbYxFGQmtfrRoCAeNb72Tss3Fni'; // <-- Replace with your mint
const SOLANA_DAI_PROGRAM_ID = 'EbQ1HRwaew1zZdSckf7pz7TtPFvD1mQBmdRR5PfbZ8s8'; // Update if your program ID is different
const IDL_PATH = path.resolve(__dirname, '../target/idl/solana_dai.json'); // Correct path for /app script location
const KEYPAIR_PATH = path.resolve(process.env.HOME, '.config/solana/id.json'); // Update if using a different keypair
const RPC_URL = 'https://api.devnet.solana.com'; // Change to your cluster
// ===================================

// Load wallet
const adminKeypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')))
);

async function main() {
    // Load IDL
    const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
    const connection = new Connection(RPC_URL, 'confirmed');
    const wallet = new anchor.Wallet(adminKeypair);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);

    const program = new anchor.Program(idl, SOLANA_DAI_PROGRAM_ID, provider);

    // Derive PDAs
    const systemStateSeed = Buffer.from('solana_dai_system_state');
    const vaultAuthoritySeed = Buffer.from('solana_dai_vault_authority');
    const [systemStatePDA] = await PublicKey.findProgramAddress(
        [systemStateSeed],
        new PublicKey(SOLANA_DAI_PROGRAM_ID)
    );
    const [vaultAuthorityPDA] = await PublicKey.findProgramAddress(
        [vaultAuthoritySeed],
        new PublicKey(SOLANA_DAI_PROGRAM_ID)
    );

    // Build and send the transaction
    const tx = await program.methods
        .initialize()
        .accounts({
            admin: adminKeypair.publicKey,
            systemState: systemStatePDA,
            daiMint: new PublicKey(DAI_MINT_ADDRESS),
            vaultAuthority: vaultAuthorityPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([adminKeypair])
        .rpc();

    console.log('Initialization transaction signature:', tx);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});