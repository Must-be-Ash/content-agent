'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cost?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  cost = '$0.25'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Confirm Video Generation
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Ready to create your video?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {/* Cost */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600">Total Cost</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">{cost}</span>
                      <span className="text-sm text-slate-500">USDC</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Includes web search, script generation, and video creation
                  </p>
                </div>

                {/* Notice */}
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>This is an experimental demo using AI agents and micropayments</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>Video generation takes 3-10 minutes</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span className="text-slate-700">No refunds on completed transactions</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span className="text-amber-700 font-medium">
                      Your prompts may violate OpenAI's content policy (violence, adult content, etc.), causing generation failure.
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl py-5 text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 rounded-xl py-5 bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                >
                  Generate Video
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
