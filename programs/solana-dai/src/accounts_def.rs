use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint as MintToken, TokenAccount, TokenInterface};
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;
use crate::DECIMALS;

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
pub struct VaultAuthority {}

#[account]
pub struct Owner {}

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
    pub dai_mint: InterfaceAccount<'info, MintToken>,

    /// This is a PDA that will hold the SOL collateral so can be UncheckedAccount
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED],
        bump,
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

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
    pub vault_authority: Account<'info, VaultAuthority>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Mint<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [SYSTEM_STATE_SEED],
        bump = system_state.bump,
    )]
    pub system_state: Account<'info, SystemState>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key(),
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        address = system_state.dai_mint,
    )]
    pub dai_mint: InterfaceAccount<'info, MintToken>,

    #[account(
        mut,
        constraint = user_dai_account.mint == dai_mint.key(),
        constraint = user_dai_account.owner == owner.key(),
    )]
    pub user_dai_account: InterfaceAccount<'info, TokenAccount>,

    pub price_update: Account<'info, PriceUpdateV2>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub price_update: Account<'info, PriceUpdateV2>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key(),
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED],
        bump,
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Burn<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub price_update: Account<'info, PriceUpdateV2>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key(),
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED],
        bump,
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    pub liquidator: Signer<'info>,

    pub owner: Account<'info, Owner>,

    pub price_update: Account<'info, PriceUpdateV2>,

    #[account(
        mut,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key(),
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED],
        bump,
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollateralRatio {}
