'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';

export function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="relative flex flex-col gap-6 items-center justify-center px-4 text-center"
        >
          <div className="text-4xl md:text-7xl font-bold text-slate-950 tracking-tight">
            Make content fast.
          </div>
          <div className="font-light text-base md:text-xl text-slate-700 max-w-2xl">
            Uses x402 and AI agentic framework to make content based on a topic you ask it for.
          </div>
          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-full px-8 py-6 text-base md:text-lg font-medium bg-slate-950 text-white hover:bg-slate-800 transition-colors shadow-lg"
            >
              Get Started
            </Button>
          </div>
        </motion.div>
      </AuroraBackground>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

