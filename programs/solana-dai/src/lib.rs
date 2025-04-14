use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, Price, PriceUpdateV2};

declare_id!("BnG9CbMoLRcpHvCsDiAuF36T8jMxXpWSGCWDn68gGxKz");

#[program]
pub mod solana_dai {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let price_update = &mut ctx.accounts.price_update;

        let price = get_latest_price(price_update).unwrap();

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        todo!()
    }

    pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
        todo!()
    }

    pub fn burn(ctx: Context<Burn>, amount: u64) -> Result<()> {
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

#[derive(Accounts)]
pub struct Deposit<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,
}

#[derive(Accounts)]
pub struct Withdraw {}

#[derive(Accounts)]
pub struct Mint {}

#[derive(Accounts)]
pub struct Burn {}

#[derive(Accounts)]
pub struct Liquidate {}

#[derive(Accounts)]
pub struct CollateralRatio {}
