use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint as SplMint, TokenAccount};
use anchor_spl::token::Token;
use crate::{DECIMALS};

// Seed constants for PDAs
pub const SYSTEM_STATE_SEED: &[u8] = b"solana_dai_system_state";
pub const VAULT_AUTHORITY_SEED: &[u8] = b"solana_dai_vault_authority";
pub const USER_VAULT_SEED: &[u8] = b"solana_dai_vault";

#[account]
pub struct SystemState {
    pub admin: Pubkey,
    pub dai_mint: Pubkey,
    pub total_debt: u64,
    pub total_collateral: u64,
    pub bump: u8,
    pub vault_authority_bump: u8,
}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub collateral: u64,
    pub debt: u64,
    pub initialized: bool,
    pub bump: u8,
}

#[account]
pub struct VaultAuthorityOwner {}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // space:
    // - 8 for discriminator
    // - 2 x 32 for pubkeys
    // - 2 x 8 for u64
    // - 2 x 1 for u8
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [SYSTEM_STATE_SEED],
        bump
    )]
    pub system_state: Account<'info, SystemState>,

    #[account(
        mut,
        mint::decimals = DECIMALS,
        mint::authority = system_state,
    )]
    pub dai_mint: InterfaceAccount<'info, SplMint>,

    /// This is a PDA that will hold the SOL collateral so can be UncheckedAccount
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED],
        bump,
    )]
    pub vault_authority: Account<'info, VaultAuthorityOwner>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [SYSTEM_STATE_SEED],
        bump = system_state.bump,
    )]
    pub system_state: Account<'info, SystemState>,

    // space:
    // - 8 for discriminator
    // - 1 x 32 for pubkeys
    // - 2 x 8 for u64
    // - 1 x 1 for bool
    // - 1 x 1 for u8
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + 32 + 8 + 8 + 1 + 1,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED],
        bump = system_state.vault_authority_bump,
    )]
    pub vault_authority: Account<'info, VaultAuthorityOwner>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Mint<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [SYSTEM_STATE_SEED], bump = system_state.bump)]
    pub system_state: Account<'info, SystemState>,
    #[account(mut, seeds = [USER_VAULT_SEED, owner.key().as_ref()], bump = vault.bump, has_one = owner)]
    pub vault: Account<'info, Vault>,
    #[account(mut, address = system_state.dai_mint)]
    pub dai_mint: InterfaceAccount<'info, SplMint>,
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = dai_mint,
        associated_token::authority = owner
    )]
    pub user_dai_account: InterfaceAccount<'info, TokenAccount>,
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = system_state.vault_authority_bump)]
    /// CHECK: Vault Authority PDA. Required as signer for mint_to.
    pub vault_authority: AccountInfo<'info>,
    /// CHECK: Pyth Price Feed Account. Deserialized and checked in instruction logic.
    pub price_update: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
}

#[derive(Accounts)]
pub struct Withdraw {}

#[derive(Accounts)]
pub struct Burn {}

#[derive(Accounts)]
pub struct Liquidate {}

#[derive(Accounts)]
pub struct CollateralRatio {}
