mod accounts_def;
pub use accounts_def::*;

use anchor_lang::prelude::*;
use anchor_spl::token::{self}; 
use pyth_sdk_solana::state::SolanaPriceAccount;
use anchor_lang::solana_program::{clock::Clock, sysvar::{Sysvar, rent::Rent}};

declare_id!("EbQ1HRwaew1zZdSckf7pz7TtPFvD1mQBmdRR5PfbZ8s8");

pub const DECIMALS: u8 = 6;
pub const LIQUDATION_THRESHOLD: u64 = 150;
pub const MIN_COLATERAL_RATIO: u64 = 200;
pub const LIQUIDATION_PENALTY: u64 = 0;
pub const SOLANA_FEED_ID: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

#[error_code]
enum ErrorCode {
    #[msg("Vault not initialized")]
    VaultNotInitialized,
    #[msg("Below minimum collateral ratio")]
    BelowCollateralRatio,
    #[msg("Over minimum collateral ratio")]
    OverCollateralRatio,
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    #[msg("Insufficient debt")]
    InsufficientDebt,
    #[msg("User has outstanding debt")]
    HasOutstandingDebt,
    #[msg("Pyth price feed not found")]
    PythPriceFeedNotFound,
    #[msg("Pyth price not available")]
    PythPriceNotAvailable,
    #[msg("Math overflow")]
    MathOverflow,
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

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // Users can only withdraw if all their debts are paid!
        // Check if vault exists and has enough collateral
        let vault = &mut ctx.accounts.vault;
        require!(vault.initialized, ErrorCode::VaultNotInitialized);
        require!(vault.collateral >= amount, ErrorCode::InsufficientCollateral);

        // Check if the user has any debt
        require!(vault.debt == 0, ErrorCode::HasOutstandingDebt);

        // Transfer SOL from vault authority to user
        let vault_authority_info = &ctx.accounts.vault_authority;
        let owner_info = &ctx.accounts.owner;

        // Create the transfer instruction with PDA as signer
        let seeds = &[
            VAULT_AUTHORITY_SEED,
            &[ctx.accounts.system_state.vault_authority_bump],
        ];
        let signer = &[&seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: vault_authority_info.to_account_info(),
                    to: owner_info.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        // Update vault state
        vault.collateral = vault.collateral.checked_sub(amount).unwrap();

        // Update system state
        let system_state = &mut ctx.accounts.system_state;
        system_state.total_collateral = system_state.total_collateral.checked_sub(amount).unwrap();

        msg!("Withdrew {} lamports of SOL", amount);
        Ok(())
    }

    pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
        // Load Price Feed Manually
        let price_feed_account_info = &ctx.accounts.price_update;
        let price_feed = SolanaPriceAccount::account_info_to_feed(price_feed_account_info)
            .map_err(|_| error!(ErrorCode::PythPriceFeedNotFound))?;

        let current_timestamp = Clock::get()?.unix_timestamp;
        let price = price_feed.get_price_no_older_than(current_timestamp, 60) // Check freshness (60 seconds)
            .ok_or(ErrorCode::PythPriceNotAvailable)?;
        // price object has .price (i64) and .expo (i32)

        // Check if vault exists and is initialized
        let vault = &mut ctx.accounts.vault;
        require!(vault.initialized, ErrorCode::VaultNotInitialized);

        // Get DAI decimals
        let dai_decimals: u32 = ctx.accounts.dai_mint.decimals.into();

        // Calculate collateral value scaled to DAI decimals
        let collateral_value_scaled_to_dai = calculate_usd_value_scaled(vault.collateral, price.price, price.expo, dai_decimals)?;

        // Calculate new total debt (assuming 'amount' is already scaled to DAI decimals)
        let new_debt_u64 = vault.debt.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        let new_debt_u128 = new_debt_u64 as u128;

        // Check if collateral ratio is maintained (MIN_COLATERAL_RATIO is in percentage, like 150 for 150%)
        let min_collateral_ratio_bps: u64 = 15000; // 150.00%
        let min_collateral_required_usd_scaled = new_debt_u64.checked_mul(min_collateral_ratio_bps)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000) // Divide by 100.00% (represented as 10000 BPS)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Current collateral USD value (scaled): {}", collateral_value_scaled_to_dai);
        msg!("Minimum required collateral USD value (scaled): {}", min_collateral_required_usd_scaled);

        require!(collateral_value_scaled_to_dai >= min_collateral_required_usd_scaled.into(), ErrorCode::BelowCollateralRatio);

        // Mint DAI tokens using Vault Authority PDA
        let system_state_account = &ctx.accounts.system_state;
        let seeds = &[
            VAULT_AUTHORITY_SEED,
            &[system_state_account.vault_authority_bump], // Use the bump stored in system_state
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.dai_mint.to_account_info(),
                    to: ctx.accounts.user_dai_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(), // Use Vault Authority PDA
                },
                signer,
            ),
            amount,
        )?;

        // Update vault state
        vault.debt = new_debt_u128.try_into().map_err(|_| ErrorCode::MathOverflow)?;

        // Update system state
        let system_state = &mut ctx.accounts.system_state;
        system_state.total_debt = system_state.total_debt.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;

        msg!("Minted {} Solana DAI", amount);
        Ok(())
    }

    pub fn burn(ctx: Context<Burn>, amount: u64) -> Result<()> {
        // Get the latest SOL price from Pyth
        let price_update = &mut ctx.accounts.price_update;
        let price = get_latest_price(price_update)?;

        // Check if vault exists and is initialized
        let vault = &mut ctx.accounts.vault;
        require!(vault.initialized, ErrorCode::VaultNotInitialized);

        require!(vault.debt >= amount, ErrorCode::InsufficientDebt);

        let new_debt = vault.debt - amount; // checked above
        let collateral_value = calculate_usd_value(vault.collateral, price);

        let min_collateral_required = new_debt
            .checked_mul(MIN_COLATERAL_RATIO)
            .unwrap()
            .checked_div(100)
            .unwrap();

        require!(collateral_value >= min_collateral_required as u128, ErrorCode::BelowCollateralRatio);

        vault.debt = new_debt;

        // Transfer SOL from user to vault authority
        let owner_info = &ctx.accounts.owner;
        let vault_authority_info = &ctx.accounts.vault_authority;

        // Create the transfer instruction using cross-program invocation
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: vault_authority_info.to_account_info(),
                    to: owner_info.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Burned {} Solana DAI", amount);
        Ok(())
    }

    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        // Get the latest SOL price from Pyth
        let price_update = &mut ctx.accounts.price_update;
        let price = get_latest_price(price_update)?;

        // Check if vault exists and is initialized
        let vault = &mut ctx.accounts.vault;
        require!(vault.initialized, ErrorCode::VaultNotInitialized);

        // Calculate collateral value in USD
        let collateral_value = calculate_usd_value(vault.collateral, price);

        let min_collateral_required = vault.debt
            .checked_mul(LIQUDATION_THRESHOLD)
            .unwrap()
            .checked_div(100)
            .unwrap();

        require!(collateral_value < min_collateral_required as u128, ErrorCode::OverCollateralRatio);

        let system_program = &ctx.accounts.system_program;
        let vault_authority_info = &ctx.accounts.vault_authority;
        let liquidator = &ctx.accounts.liquidator;

        anchor_lang::system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: vault_authority_info.to_account_info(),
                    to: liquidator.to_account_info(),
                },
            ),
            vault.collateral,
        )?;

        vault.collateral = 0;
        vault.debt = 0;

        msg!("Liquidated vault with collateral value of {} USD", vault.collateral);
        Ok(())
    }
}

fn get_latest_price(price_update: &AccountInfo) -> Result<(i64, i32)> {
    let price_feed = pyth_sdk_solana::state::SolanaPriceAccount::account_info_to_feed(price_update)
        .map_err(|_| error!(ErrorCode::PythPriceFeedNotFound))?;
    let current_timestamp = Clock::get()?.unix_timestamp;
    let price = price_feed.get_price_no_older_than(current_timestamp, 60)
        .ok_or(ErrorCode::PythPriceNotAvailable)?;
    Ok((price.price, price.expo))
}

fn calculate_usd_value(sol_lamports: u64, price_tuple: (i64, i32)) -> u128 {
    // Use 6 decimals for DAI
    let (price, exponent) = price_tuple;
    // Reuse the scaled version for consistency
    calculate_usd_value_scaled(sol_lamports, price, exponent, 6).unwrap_or(0)
}

fn calculate_usd_value_scaled(sol_lamports: u64, price: i64, exponent: i32, dai_decimals: u32) -> Result<u128> {
    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
    let price_abs = price.checked_abs().ok_or(ErrorCode::MathOverflow)? as u128;
    let exponent_abs = exponent.checked_abs().ok_or(ErrorCode::MathOverflow)? as u32;
    let ten_pow_dai_decimals = 10u128.checked_pow(dai_decimals).ok_or(ErrorCode::MathOverflow)?;

    let intermediate_numerator = (sol_lamports as u128).checked_mul(price_abs).ok_or(ErrorCode::MathOverflow)?;
    let final_numerator = intermediate_numerator.checked_mul(ten_pow_dai_decimals).ok_or(ErrorCode::MathOverflow)?;

    let ten_pow_exponent_abs = 10u128.checked_pow(exponent_abs).ok_or(ErrorCode::MathOverflow)?;
    let denominator = (LAMPORTS_PER_SOL as u128).checked_mul(ten_pow_exponent_abs).ok_or(ErrorCode::MathOverflow)?;

    let final_value = final_numerator.checked_div(denominator)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(final_value) // Return the calculated value
}