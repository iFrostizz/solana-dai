import {
  Program,
  AnchorProvider,
  Idl,
  web3,
  BN,
} from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Commitment,
} from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/solana_dai.json"; 
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';

export const SOLANA_DAI_PROGRAM_ID = new PublicKey(
  "H4TppkUN6CSgNBm4VWmccwF2UJ7qV1BpunbZV3vXkehB"
);

// Placeholder: Replace with the actual Pyth SOL/USD Price Feed ID for your cluster
export const PYTH_SOL_USD_PRICE_ACCOUNT = new PublicKey(
  "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE" // Example for Devnet - FIND THE CORRECT FEED ID
);


const SYSTEM_STATE_SEED = Buffer.from("solana_dai_system_state");
const VAULT_AUTHORITY_SEED = Buffer.from("solana_dai_vault_authority");
const USER_VAULT_SEED = Buffer.from("solana_dai_vault");

// Helper to get the program instance
export const getProgram = (
  connection: Connection,
  wallet: AnchorWallet
): Program => {
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
    commitment: "processed",
  });
  // Correct argument order: (idl, programId, provider)
  const program = new Program(
    idl as Idl, // Use the imported JSON IDL
    SOLANA_DAI_PROGRAM_ID,
    provider
  );
  return program;
};

// --- PDA Derivations ---

export const findSystemStatePDA = () => {
  return PublicKey.findProgramAddressSync(
    [SYSTEM_STATE_SEED],
    SOLANA_DAI_PROGRAM_ID
  )[0];
};

export const findVaultAuthorityPDA = () => {
  return PublicKey.findProgramAddressSync(
    [VAULT_AUTHORITY_SEED],
    SOLANA_DAI_PROGRAM_ID
  )[0];
};

export const findUserVaultPDA = (owner: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [USER_VAULT_SEED, owner.toBuffer()],
    SOLANA_DAI_PROGRAM_ID
  )[0];
};

// --- Instruction Builders ---

/**
 * Creates the instruction to initialize the Solana DAI system state.
 * Requires the admin keypair to sign.
 * NOTE: The daiMint PublicKey must be an initialized Mint account *before* calling this.
 */
export const createInitializeInstruction = async (
  program: Program,
  admin: PublicKey,
  daiMint: PublicKey
) => {
  const systemStatePDA = findSystemStatePDA();
  const vaultAuthorityPDA = findVaultAuthorityPDA();

  return program.methods
    .initialize()
    .accounts({
      admin: admin,
      systemState: systemStatePDA,
      daiMint: daiMint,
      vaultAuthority: vaultAuthorityPDA,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      // Note: The Rust struct uses InterfaceAccount<'info, MintToken> for dai_mint
      // Anchor TS client might implicitly require token_program if using interfaces? Check documentation.
      // If it complains about token_program, add: tokenProgram: TOKEN_PROGRAM_ID
    })
    .instruction();
};

/**
 * Creates the instruction to deposit SOL collateral into a user's vault.
 * If the vault doesn't exist, it will be initialized.
 */
export const createDepositInstruction = async (
  program: Program,
  owner: PublicKey,
  amountLamports: BN
) => {
  const systemStatePDA = findSystemStatePDA();
  const vaultPDA = findUserVaultPDA(owner);
  const vaultAuthorityPDA = findVaultAuthorityPDA();

  return program.methods
    .deposit(amountLamports)
    .accounts({
      owner: owner,
      systemState: systemStatePDA,
      vault: vaultPDA,
      vaultAuthority: vaultAuthorityPDA,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();
};

/**
 * Creates the instruction to mint DAI against deposited collateral.
 */
export const createMintInstruction = async (
  program: Program,
  owner: PublicKey,
  amountDaiLamports: BN, // Amount of DAI to mint (considering decimals)
  daiMint: PublicKey, // The PublicKey of the DAI mint
  priceUpdateAccount: PublicKey // The Pyth PriceUpdateV2 account for SOL/USD
) => {
  const systemStatePDA = findSystemStatePDA();
  const vaultPDA = findUserVaultPDA(owner);
  const userDaiATA = getAssociatedTokenAddressSync(daiMint, owner); // Derive user's ATA for DAI

  return program.methods
    .mint(amountDaiLamports)
    .accounts({
      owner: owner,
      systemState: systemStatePDA,
      vault: vaultPDA,
      daiMint: daiMint,
      userDaiAccount: userDaiATA,
      priceUpdate: priceUpdateAccount,
      tokenProgram: TOKEN_PROGRAM_ID, // Explicitly needed for the token CPI
    })
    .instruction();
};

// --- Read Functions ---

const LAMPORTS_PER_SOL_BN = new BN(1_000_000_000);

// Replicates the calculate_usd_value logic from Rust in TypeScript
// NOTE: This uses BN.js for large number arithmetic.
// Takes the price data object from @pythnetwork/client
// It expects an object with 'price' (string) and 'exponent' (number)
function calculateUsdValue(amountLamports: BN, priceData: { price: string | undefined; exponent: number | undefined }): BN {
    if (priceData.price === undefined || priceData.exponent === undefined) {
        // Handle cases where price data might be missing
        console.error("Price or exponent missing from Pyth data");
        return new BN(0); // Or throw an error
    }
    const exponent = Math.abs(priceData.exponent);
    const priceVal = new BN(priceData.price); // price is already a string representation of i64
    const ten = new BN(10);
    const tenPowExponent = ten.pow(new BN(exponent));

    // Ensure price is positive
    const nonNegativePrice = priceVal.isNeg() ? new BN(0) : priceVal;

    let priceScaled: BN;
    if (priceData.exponent < 0) {
        priceScaled = nonNegativePrice; // Use price directly, division happens later
    } else {
        priceScaled = nonNegativePrice.mul(tenPowExponent);
    }

    // Perform calculation: (amount * price_scaled / LAMPORTS_PER_SOL) / 10^exponent (if exponent < 0)
    // or: (amount * price_scaled / LAMPORTS_PER_SOL) (if exponent >= 0)
    const baseValue = amountLamports.mul(priceScaled).div(LAMPORTS_PER_SOL_BN);

    if (priceData.exponent < 0) {
        return baseValue.div(tenPowExponent);
    } else {
        return baseValue;
    }
}

/**
 * Fetches vault data and Pyth price to calculate the collateral ratio.
 * Returns the ratio as a percentage (e.g., 250.5 for 250.5%).
 * Returns null if the vault is not initialized or price data is unavailable.
 */
export const getCollateralRatio = async (
  program: Program,
  connection: Connection,
  owner: PublicKey,
  priceUpdateAccount: PublicKey // The Pyth PriceFeed ID (e.g., SOL/USD Feed ID)
): Promise<number | null> => {
  try {
    const vaultPDA = findUserVaultPDA(owner);

    // Fetch Vault account data
    const vaultAccountInfo = await connection.getAccountInfo(vaultPDA);
    if (!vaultAccountInfo) return null; // Vault doesn't exist
    // Use Anchor's coder to decode
    const vaultData = program.coder.accounts.decode("Vault", vaultAccountInfo.data);
    if (!vaultData.initialized) return null; // Vault not initialized

    // Use PythHttpClient to fetch price data
    // Determine cluster based on connection URL (simple check)
    const cluster = connection.rpcEndpoint.includes("devnet") ? "devnet" :
                    connection.rpcEndpoint.includes("mainnet") ? "mainnet-beta" :
                    "pythnet"; // Default to pythnet for local/unknown
    const pythPublicKey = getPythProgramKeyForCluster(cluster);
    const pythClient = new PythHttpClient(connection, pythPublicKey);

    // Fetch the latest price feed for the given priceUpdateAccount (which should be the Feed ID)
    const priceData = await pythClient.getLatestPriceFeeds([priceUpdateAccount]);

    if (!priceData || priceData.length === 0 || !priceData[0]) {
        console.error("Could not get price feed from Pyth HTTP Client for Feed ID:", priceUpdateAccount.toBase58());
        return null;
    }

    // priceData is an array, get the first element which corresponds to our requested feed ID
    const latestPrice = priceData[0].getPriceNoOlderThan(60); // Check price is not older than 60 seconds

    if (!latestPrice) {
        console.error("Pyth price is too old or unavailable for Feed ID:", priceUpdateAccount.toBase58());
        return null;
    }
    // latestPrice contains { price: string, conf: string, exponent: number, publishTime: number }

    const collateralLamports = new BN(vaultData.collateral);
    const debtLamports = new BN(vaultData.debt);

    if (debtLamports.isZero()) {
      // If there's no debt, the ratio is effectively infinite (or undefined).
      return Infinity;
    }

    // Use the latestPrice object directly in the calculation
    const collateralValueUSD = calculateUsdValue(collateralLamports, latestPrice);

    // Calculate ratio: (collateral_value_usd * 10000) / debt_lamports (for 2 decimal places)
    const ratio = collateralValueUSD
      .mul(new BN(10000))
      .div(debtLamports);

    return ratio.toNumber() / 100; // Return as percentage number

  } catch (error) {
    console.error("Error getting collateral ratio:", error);
    return null;
  }
};
