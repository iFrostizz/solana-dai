use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

declare_id!("BnG9CbMoLRcpHvCsDiAuF36T8jMxXpWSGCWDn68gGxKz");

#[program]
pub mod solana_dai {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>, deposit_amount: u64) -> Result<()> {
        if deposit_amount <= 0 {
            return err!(ErrorCode::InvalidDepositAmount);
        }
        msg!("Depositing {} to vault", deposit_amount);

        // TODO: add deposit logic
        let deposit_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.signer_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        );
        transfer(deposit_ctx, deposit_amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    #[account(mut, token::mint=mint, token::authority=owner)]
    signer_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        space = 8 + 32 + 8, // not sure how to properly set space
        payer = signer,
        seeds = [b"vault", signer.key().as_ref()],
        bump,
     )]
    pub vault: Account<'info, Vault>,

    #[account(
            init,
            payer = signer,
            token::mint=mint,
            token::authority=vault_authority,
            seeds = [b"tokens".as_ref(), vault.key().as_ref()], bump
        )]
    vault_token_account: Account<'info, TokenAccount>,

    // programs
    pub system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[account]
pub struct Vault {
    pub collateral: u64,
    pub amount_withdrawn: u64,
    pub owner: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount must be greater than 0")]
    InvalidDepositAmount,
}
