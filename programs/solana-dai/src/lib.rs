use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, Token2022};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, Price, PriceUpdateV2};

declare_id!("H3iTsqav7j1GsfqpzUJaTL89NHtuZBTVgrLDJGNjFqmi");

const SOL_USD_FEED_ID: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const BASIS_POINTS: u64 = 10_000;

#[program]
pub mod solana_dai {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, liquidation_threshold: u64) -> Result<()> {
        ctx.accounts.config.liquidation_threshold = liquidation_threshold;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let price_update = &mut ctx.accounts.price_update;

        let price = get_latest_price(price_update).unwrap();

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        todo!()
    }

    pub fn liquidate(ctx: Context<Liquidate>, amount: u64) -> Result<()> {
        todo!()
    }

    pub fn collateral_ratio(ctx: Context<CollateralRatio>, account: Pubkey) -> Result<()> {
        todo!()
    }
}

fn get_latest_price(price_update: &mut Account<'_, PriceUpdateV2>) -> Result<Price> {
    // get_price_no_older_than will fail if the price update is more than 30 seconds old
    let maximum_age: u64 = 30;

    // get_price_no_older_than will fail if the price update is for a different price feed.
    // This string is the id of the SOL/USD feed. See https://pyth.network/developers/price-feed-ids for all available IDs.
    let feed_id: [u8; 32] = get_feed_id_from_hex(SOL_USD_FEED_ID)?;
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

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub liquidation_threshold: u64, // in basis points
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        seeds = ["CONFIG".as_bytes()],
        bump,
        payer = signer,
        space = 8 + Config::INIT_SPACE,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: the ownership is checked by seeds
    #[account(
        seeds = ["MINT_AUTHORITY".as_bytes()],
        bump,
    )]
    pub authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = signer,
        seeds = ["MINT".as_bytes()],
        bump,
        mint::decimals = 9,
        mint::authority = authority,
        mint::token_program = token_2022_program,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_2022_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,
}

#[derive(Accounts)]
pub struct Withdraw {}

#[derive(Accounts)]
pub struct Liquidate {}

#[derive(Accounts)]
pub struct CollateralRatio {}
