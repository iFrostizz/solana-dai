"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Transaction, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { BN, Program, Wallet } from '@coral-xyz/anchor';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input'; 
import { 
  getProgram, 
  createDepositInstruction, 
  createMintInstruction, 
  getCollateralRatio, 
  PYTH_SOL_USD_PRICE_ACCOUNT, 
  findSystemStatePDA 
} from '@/utils/solanaDaiInteractions';
import { SolanaDai } from '@/idl/solana_dai'; 

const DAI_DECIMALS = 6; 
const DAI_FACTOR = new BN(10).pow(new BN(DAI_DECIMALS));

export default function ManageCDP() {
  const { connected, publicKey } = useWallet(); 
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet(); 
  
  const [depositAmount, setDepositAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [collateralRatio, setCollateralRatio] = useState<number | null>(null);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isFetchingRatio, setIsFetchingRatio] = useState(false);
  const [daiMintAddress, setDaiMintAddress] = useState<PublicKey | null>(null); 
  const [isFetchingSystemState, setIsFetchingSystemState] = useState(false);
  const [isMounted, setIsMounted] = useState(false); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const program = useMemo(() => {
    if (!isMounted || !connected || !publicKey || !anchorWallet) return null;

    return getProgram(connection, anchorWallet);

  }, [connected, publicKey, connection, isMounted, anchorWallet]); 

  // Modified to accept program instance
  const updateCollateralRatio = useCallback(async (prog: Program<SolanaDai> | null) => {
    if (!prog || !publicKey) return;

    setIsFetchingRatio(true);
    setStatusMessage(null);
    try {
      const ratio = await getCollateralRatio(prog, connection, publicKey, PYTH_SOL_USD_PRICE_ACCOUNT);
      setCollateralRatio(ratio);
    } catch (error: any) {
      console.error("Failed to fetch collateral ratio:", error);
      setCollateralRatio(null);
      setStatusMessage({ text: `Failed to fetch ratio: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsFetchingRatio(false);
    }
  }, [publicKey, connection]); 

  useEffect(() => {
    const fetchInitialData = async (prog: Program<SolanaDai>) => { 
        if (!publicKey) return; 

        setIsFetchingSystemState(true);
        let systemStateExists = false; 
        try {
            const systemStatePDA = findSystemStatePDA();
            const systemStateInfo = await connection.getAccountInfo(systemStatePDA); 

            if (systemStateInfo) {
              const systemState = prog.coder.accounts.decode("SystemState", systemStateInfo.data);
              setDaiMintAddress(systemState.daiMint);
              console.log("DAI Mint Address fetched:", systemState.daiMint.toBase58());
              systemStateExists = true; 
            } else {
              console.warn("SystemState account not found. Please initialize the program.");
              setStatusMessage({ text: 'Program configuration (SystemState) not found. Needs initialization.', type: 'error' });
              setDaiMintAddress(null);
            }
        } catch (err: any) {
            console.error("Failed to fetch/decode system state:", err);
            setStatusMessage({ text: `Failed to fetch program configuration: ${err.message || 'Unknown error'}`, type: 'error' });
            setDaiMintAddress(null);
        } finally {
            setIsFetchingSystemState(false);
        }

        if (systemStateExists) {
            await updateCollateralRatio(prog);
        }
    };

    if (connected && program) {
        fetchInitialData(program);
    }
  }, [connected, program, publicKey, connection, isMounted]);

  const handleTransaction = useCallback(async (instructionPromise: Promise<TransactionInstruction>, successMessage: string, errorMessagePrefix: string) => {
    if (!program || !anchorWallet) { 
        setStatusMessage({ text: 'Wallet not connected or program not ready.', type: 'error' });
        console.error("handleTransaction: Program or anchorWallet is null.");
        return;
    }
    const provider = program.provider;
    if (!provider) {
       setStatusMessage({ text: 'Program provider not ready.', type: 'error' });
       console.error("handleTransaction: Program provider is null.");
       return;
    }
    if (!publicKey) {
       setStatusMessage({ text: 'Wallet not connected.', type: 'error' });
       console.error("handleTransaction: Public key is null.");
       return;
    }

    setIsProcessingTx(true);
    setStatusMessage(null);

    try {
        const instruction = await instructionPromise;
        const tx = new Transaction().add(instruction);

        if (!provider) {
          throw new Error("Provider is not available after initial check."); 
        }
        
        const signature = await provider.sendAndConfirm(tx);

        setStatusMessage({ text: `${successMessage} Signature: ${signature}`, type: 'success' });
        setDepositAmount(''); 
        setMintAmount('');
        await updateCollateralRatio(program); 
    } catch (error: any) {
        console.error(`${errorMessagePrefix} error:`, error);
        let message = error.message || 'Unknown error';
        if (error.logs) { 
          const log = error.logs.find((l: string) => l.includes('Program log: Error: '));
          if (log) {
            message = log.split('Program log: Error: ')[1];
          } else if (error.toString().includes('0x1771')) { 
             message = "Slippage tolerance exceeded. Please try again.";
          } else if (error.toString().includes('Transaction simulation failed')) {
            message = "Transaction simulation failed. Check inputs or network congestion.";
          }
        }
        setStatusMessage({ text: `${errorMessagePrefix}: ${message}`, type: 'error' });
    } finally {
        setIsProcessingTx(false);
    }
  }, [program, publicKey, connection, updateCollateralRatio, anchorWallet]); 

  const handleDeposit = useCallback(async () => {
    if (!program || !publicKey || !depositAmount) return;
    if (isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
        setStatusMessage({ text: 'Invalid deposit amount.', type: 'error' });
        return;
    }

    const amountSOL = parseFloat(depositAmount);
    const amountLamports = new BN(amountSOL * LAMPORTS_PER_SOL);
    
    await handleTransaction(
        createDepositInstruction(program, publicKey, amountLamports),
        'Deposit successful!',
        'Deposit failed'
    );
  }, [program, publicKey, depositAmount, handleTransaction]);

  const handleMint = useCallback(async () => {
    if (!program || !publicKey || !mintAmount) return;
    if (isNaN(parseFloat(mintAmount)) || parseFloat(mintAmount) <= 0) {
        setStatusMessage({ text: 'Invalid mint amount.', type: 'error' });
        return;
    }
    if (!daiMintAddress) {
      setStatusMessage({ text: 'DAI configuration not loaded. Cannot mint.', type: 'error' });
      return;
    }

    const amountDAI = parseFloat(mintAmount);
    const amountBaseUnits = new BN(amountDAI).mul(DAI_FACTOR);

    await handleTransaction(
        createMintInstruction(program, publicKey, amountBaseUnits, daiMintAddress, PYTH_SOL_USD_PRICE_ACCOUNT),
        'Mint successful!',
        'Mint failed'
    );
  }, [program, publicKey, mintAmount, handleTransaction, daiMintAddress]); 

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Manage Your Vault</h1>

        {!connected ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">Connect your wallet to manage your vault.</p>
            <Button variant="primary" size="lg" disabled>
              Connect Wallet (Use Adapter Button)
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">Vault Status</h2>
              {isFetchingSystemState && <p className="text-sm text-muted-foreground mb-2">Loading configuration...</p>}
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Collateral Ratio:</span>
                {isFetchingRatio ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : collateralRatio !== null ? (
                  <span className={`font-bold text-lg ${collateralRatio < 1.5 ? 'text-error' : collateralRatio < 2 ? 'text-warning' : 'text-success'}`}>
                    {(collateralRatio * 100).toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
            </section>

            <section className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">Deposit SOL</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label htmlFor="deposit-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (SOL)</label>
                  <input 
                      id="deposit-amount"
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)} 
                      placeholder="e.g., 1.5" 
                      disabled={isProcessingTx}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <Button 
                    variant="primary"
                    onClick={handleDeposit}
                    disabled={isProcessingTx || !depositAmount || parseFloat(depositAmount) <= 0}
                    className="w-full sm:w-auto"
                >
                    {isProcessingTx ? 'Processing...' : 'Deposit SOL'}
                </Button>
              </div>
            </section>

            <section className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">Mint DAI</h2>
               <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label htmlFor="mint-amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (DAI)</label>
                  <input 
                      id="mint-amount"
                      type="number" 
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)} 
                      placeholder="e.g., 100" 
                      disabled={isProcessingTx}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <Button 
                    variant="secondary" 
                    onClick={handleMint}
                    disabled={isProcessingTx || !mintAmount || parseFloat(mintAmount) <= 0 || collateralRatio === null || !daiMintAddress}
                    className="w-full sm:w-auto"
                >
                    {isProcessingTx ? 'Processing...' : 'Mint DAI'}
                </Button>
              </div>
              {collateralRatio !== null && collateralRatio < 1.5 && (
                  <p className="text-sm text-error mt-3">Warning: Minting more DAI may lower your collateral ratio further, increasing liquidation risk.</p>
              )}
            </section>

            {statusMessage && (
                <div className={`p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                    {statusMessage.text}
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
