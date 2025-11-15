'use client';

import { CDPReactProvider } from '@coinbase/cdp-react';

// CDP Configuration - using EOA only (no smart accounts)
// This matches the firecrawl-402demo pattern for simpler wallet management
const CONFIG = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? '',
  appName: 'AI Content Generator',
  appLogoUrl: '/logo.svg',
  ethereum: {
    createOnLogin: "eoa" as const,  // Explicitly create EOA wallet only
  },
  solana: {
    // No Solana wallet creation
  },
};

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CDPReactProvider config={CONFIG}>
      {children}
    </CDPReactProvider>
  );
}
