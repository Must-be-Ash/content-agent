'use client';

import { CDPReactProvider } from '@coinbase/cdp-react';

// CDP Configuration - following slop-machine pattern with required properties
const CONFIG = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? '',
  appName: 'AI Content Generator',
  appLogoUrl: '/logo.svg',
  ethereum: {
    createOnLogin: 'smart' as const,
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
