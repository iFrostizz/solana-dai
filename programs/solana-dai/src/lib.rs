mod accounts_def;
pub use accounts_def::*;

use anchor_lang::prelude::*;
use anchor_spl::token;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, Price, PriceUpdateV2};

declare_id!("BnG9CbMoLRcpHvCsDiAuF36T8jMxXpWSGCWDn68gGxKz");

pub const DECIMALS: u8 = 6;
pub const LIQUDATION_THRESHOLD: u64 = 150;
pub const MIN_COLATERAL_RATIO: u64 = 200;
pub const LIQUIDATION_PENALTY: u64 = 0;
pub const SOLANA_FEED_ID: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

#[error_code]
enum ErrorCode {
    VaultNotInitialized,
    BelowCollateralRatio
}

#[program]
pub mod solana_dai {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let system_state = &mut ctx.accounts.system_state;
        system_state.admin = ctx.accounts.admin.key();
        system_state.dai_mint = ctx.accounts.dai_mint.key();
        system_state.total_debt = 0;
        system_state.total_collateral = 0;
        system_state.bump = ctx.bumps.system_state;
        system_state.vault_authority_bump = ctx.bumps.vault_authority;

        msg!("Initialized Solana DAI system");
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // Create a vault if it doesn't exist
        let vault = &mut ctx.accounts.vault;
        if !vault.initialized {
            vault.owner = ctx.accounts.owner.key();
            vault.collateral = 0;
            vault.debt = 0;
            vault.initialized = true;
            vault.bump = ctx.bumps.vault;
        }

        // Transfer SOL from user to vault authority
        let system_program = &ctx.accounts.system_program;
        let owner_info = &ctx.accounts.owner;
        let vault_authority_info = &ctx.accounts.vault_authority;

        // Create the transfer instruction using cross-program invocation
        anchor_lang::system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: owner_info.to_account_info(),
                    to: vault_authority_info.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update personal vault collateral state
        vault.collateral = vault.collateral.checked_add(amount).unwrap();

        // Update system state
        let system_state = &mut ctx.accounts.system_state;
        system_state.total_collateral = system_state.total_collateral.checked_add(amount).unwrap();

        msg!("Deposited {} lamports of SOL", amount);
        Ok(())
    }

    pub fn withdraw(_ctx: Context<Withdraw>, _amount: u64) -> Result<()> {
        todo!()
    }

    pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
        // Get the latest SOL price from Pyth
        let price_update = &mut ctx.accounts.price_update;
        let price = get_latest_price(price_update)?;

        // Check if vault exists and is initialized
        let vault = &mut ctx.accounts.vault;
        require!(vault.initialized, ErrorCode::VaultNotInitialized);

        // Calculate collateral value in USD
        let collateral_value = calculate_usd_value(vault.collateral, price);

        // Calculate new total debt
        let new_debt = vault.debt.checked_add(amount).unwrap();

        // Check if collateral ratio is maintained (MIN_COLATERAL_RATIO is in percentage, like 200 for 200%)
        let min_collateral_required = new_debt
            .checked_mul(MIN_COLATERAL_RATIO)
            .unwrap()
            .checked_div(100)
            .unwrap();

        require!(collateral_value >= min_collateral_required, ErrorCode::BelowCollateralRatio);

        // Mint DAI tokens to the user via the system state
        let system_state = &ctx.accounts.system_state;
        let seeds = &[
            SYSTEM_STATE_SEED,
            &[system_state.bump],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.dai_mint.to_account_info(),
                    to: ctx.accounts.user_dai_account.to_account_info(),
                    authority: ctx.accounts.system_state.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        // Update vault state
        vault.debt = new_debt;

        // Update system state
        let system_state = &mut ctx.accounts.system_state;
        system_state.total_debt = system_state.total_debt.checked_add(amount).unwrap();

        msg!("Minted {} Solana DAI", amount);
        Ok(())
    }

    pub fn burn(_ctx: Context<Burn>, _amount: u64) -> Result<()> {
        todo!()
    }

    pub fn liquidate(_ctx: Context<Liquidate>, _amount: u64) -> Result<()> {
        todo!()
    }

    pub fn collateral_ratio(_ctx: Context<CollateralRatio>, _account: Pubkey) -> Result<()> {
        todo!()
    }

}

fn get_latest_price(price_update: &mut Account<'_, PriceUpdateV2>) -> Result<Price> {
    // get_price_no_older_than will fail if the price update is more than 30 seconds old
    let maximum_age: u64 = 30;

    // get_price_no_older_than will fail if the price update is for a different price feed.
    // This string is the id of the SOL/USD feed. See https://pyth.network/developers/price-feed-ids for all available IDs.
    let feed_id: [u8; 32] = get_feed_id_from_hex(
        "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    )?;
    let price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;

    // Sample output:
    // The price is (7160106530699 ± 5129162301) * 10^-8
    msg!(
        "The price is ({} ± {}) * 10^{}",
        price.price,
        price.conf,
        price.exponent
    );

    Ok(price)
}

fn calculate_usd_value(amount: u64, price: Price) -> u64 {
    let exponent = price.exponent.abs() as u32;
    let price_val = price.price.max(0) as u64;
    let price_scaled = if price.exponent < 0 {
        price_val
    } else {
        price_val.checked_mul(10_u64.pow(exponent)).unwrap()
    };

    if price.exponent < 0 {
        amount
            .checked_mul(price_scaled)
            .unwrap()
            .checked_div(LAMPORTS_PER_SOL)
            .unwrap()
            .checked_div(10_u64.pow(exponent))
            .unwrap()
    } else {
        amount
            .checked_mul(price_scaled)
            .unwrap()
            .checked_div(LAMPORTS_PER_SOL)
            .unwrap()
    }
}

#[account]
pub struct SystemState {
    admin: Pubkey,
    dai_mint: Pubkey,
    total_debt: u64,
    total_collateral: u64,
    bump: u8,
    vault_authority_bump: u64,
}

#[account]
pub struct Vault {
    initialized: bool,
    collateral: u64,
    debt: u64,
    owner: Pubkey,
    bump: u8,
}