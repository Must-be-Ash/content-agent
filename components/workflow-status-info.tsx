'use client';

import { ExternalLink, AlertCircle, Video, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WorkflowStatusInfoProps {
  genbaseTaskId?: string | null;
  transactionHash?: string | null;
  walletAddress?: string;
}

export function WorkflowStatusInfo({
  genbaseTaskId,
  transactionHash,
  walletAddress,
}: WorkflowStatusInfoProps) {
  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50 mb-6">
      <CardContent className="p-6 space-y-4">
        {/* Warning Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-900 text-sm">
              Video Generation in Progress
            </p>
            <p className="text-xs text-blue-700">
              Please don't refresh the page. This may take 3-10 minutes.
            </p>
          </div>
        </div>

        {/* Tracking Information */}
        <div className="space-y-3">
          {/* Genbase Task ID */}
          {genbaseTaskId && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-blue-100">
              <Video className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Genbase Video Task ID
                </p>
                <p className="text-xs font-mono text-slate-900 break-all">
                  {genbaseTaskId}
                </p>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {transactionHash && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-blue-100">
              <Receipt className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Payment Transaction
                </p>
                <a
                  href={`https://basescan.org/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-600 hover:text-blue-700 hover:underline break-all inline-flex items-center gap-1"
                >
                  {transactionHash}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Wallet Address */}
          {walletAddress && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-blue-100">
              <Receipt className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-600 mb-1">
                  Your Wallet Address
                </p>
                <p className="text-xs font-mono text-slate-900 break-all">
                  {walletAddress}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Support Information */}
        <div className="pt-3 border-t border-blue-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-medium text-slate-700">Need help?</span> If you paid but didn't receive your video, contact{' '}
            <a
              href="mailto:contact@genbase.fun"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              contact@genbase.fun
            </a>
            {' '}with your Video Task ID and wallet address shown above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
