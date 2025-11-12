'use client';

import { useEvmAddress, useIsSignedIn, useSignOut } from '@coinbase/cdp-hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Wallet, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

export function WalletStatus() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { signOut } = useSignOut();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (isSignedIn && evmAddress) {
      fetchBalance();
    }
  }, [isSignedIn, evmAddress]);

  const fetchBalance = async () => {
    if (!evmAddress) return;

    setLoading(true);
    try {
      const client = createPublicClient({
        chain: base,
        transport: http(),
      });

      const balanceResult = await client.readContract({
        address: USDC_ADDRESS,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [evmAddress as `0x${string}`],
      });

      const formattedBalance = parseFloat(formatUnits(balanceResult, USDC_DECIMALS));
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (!evmAddress) return;

    try {
      await navigator.clipboard.writeText(evmAddress);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 p-4 sm:p-5 shadow-lg border bg-background/95 backdrop-blur-sm z-50">
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <span className="text-sm sm:text-base font-semibold">Wallet</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBalance}
            disabled={loading}
            className="h-8 w-8 p-0"
            aria-label="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {evmAddress && (
          <div className="space-y-3 sm:space-y-3.5 pt-1">
            {/* Address Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">Address</span>
                {copied && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 font-medium">
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
                title="Click to copy full address"
              >
                <span className="font-mono text-xs sm:text-sm text-foreground truncate">
                  {truncateAddress(evmAddress)}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            </div>

            {/* Balance Section */}
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Balance</span>
              <div className="flex items-baseline justify-between p-2.5 sm:p-3 rounded-lg bg-muted/30">
                <div className="flex flex-col">
                  <span className="text-lg sm:text-2xl font-bold text-foreground">
                    {balance !== null ? (
                      `$${balance.toFixed(2)}`
                    ) : (
                      <span className="text-sm sm:text-base text-muted-foreground">Loading...</span>
                    )}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">USDC on Base</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4 sm:mt-5 h-9 sm:h-10 text-sm font-medium"
          onClick={() => signOut()}
        >
          Logout
        </Button>
      </div>
    </Card>
  );
}
