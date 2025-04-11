use anchor_lang::prelude::*;

declare_id!("BnG9CbMoLRcpHvCsDiAuF36T8jMxXpWSGCWDn68gGxKz");

#[program]
pub mod solana_dai {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
