'use client';

import { SignInModal } from '@coinbase/cdp-react';
import { Card } from '@/components/ui/card';
import { Sparkles, Wallet, Zap } from 'lucide-react';

export function SignInScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            AI Content Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate AI-powered video content with micropayments
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Instant Generation</h3>
              <p className="text-xs text-muted-foreground">
                Create professional videos in minutes
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Pay Per Use</h3>
              <p className="text-xs text-muted-foreground">
                Only pay for what you generate with x402 micropayments
              </p>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="pt-4">
          <SignInModal>
            <button className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition shadow-sm">
              Get Started
            </button>
          </SignInModal>
          <p className="text-xs text-center text-muted-foreground mt-3">
            A secure wallet will be created for you automatically
          </p>
        </div>

        {/* Cost Breakdown */}
        <div className="pt-4 space-y-2 border-t">

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost per video:</span>
            <span className="font-semibold">~$0.25 USDC</span>
          </div>
       
        </div>
      </Card>
    </div>
  );
}
