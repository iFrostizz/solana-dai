use anchor_lang::prelude::*;

declare_id!("BnG9CbMoLRcpHvCsDiAuF36T8jMxXpWSGCWDn68gGxKz");

#[program]
pub mod dai {}

#[program]
pub mod oracle {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, initial_price: i64) -> Result<()> {
        if ctx.accounts.initialized(ctx) {
            panic!("already initialized");
        }
        ctx.accounts.price = initial_price;
        ctx.accounts.initialized = true;
        Ok(())
    }

    pub fn initialized(ctx: Context<Initialize>) -> bool {
        ctx.accounts.initialized
    }

    pub fn latest_price(ctx: Context<Oracle>) -> i64 {
        if !ctx.accounts.initialized(ctx) {
            panic!("uninitialized price");
        }
        ctx.accounts.price
    }

    pub fn set_price(ctx: Context<Oracle>, price: i64) -> Result<()> {
        todo!("access control!");
        ctx.accounts.price = price;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
    initialized: bool,
    price: i64
}

#[derive(Accounts)]
pub struct Oracle {
    price: i64
}

#[program]
pub mod solana_dai {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        todo!()
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

#[derive(Accounts)]
pub struct Deposit {}

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
