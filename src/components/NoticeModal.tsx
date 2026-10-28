import React, { useState, useEffect } from 'react';
import { X, Info, Clock, Heart, ShieldAlert, Sparkles } from 'lucide-react';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!isOpen) return;

    setSecondsRemaining(60);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progressPercentage = ((60 - secondsRemaining) / 60) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Top Countdown Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-rose-700 transition-all duration-1000 ease-linear"
            style={{ width: `${100 - progressPercentage}%` }}
          />
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-7 text-center">
          {/* Close / Cancel Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="Cancel and close notice"
            aria-label="Cancel and close notice"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Badge */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-md border-2 border-rose-100 bg-white p-1">
            <img
              src="/assets/aistudio/1793168465779_fb1efee5.jpg"
              alt="CustechBot Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          {/* Header Title */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>Student Notice & Disclaimer</span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome to CustechBot
          </h3>

          {/* Core Message requested by user */}
          <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-150 text-slate-700 text-sm leading-relaxed space-y-2.5">
            <p className="font-semibold text-rose-950 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-800 shrink-0" />
              <span>This website is not an official website.</span>
            </p>
            <p className="text-xs text-slate-600">
              It is designed purely to assist students with daily academic tasks and overcome document handling difficulties.
            </p>
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-xs font-bold text-slate-900">
                Created with <Heart className="w-3.5 h-3.5 text-rose-600 inline fill-rose-600 mx-0.5" /> by{' '}
                <span className="text-rose-900 underline decoration-rose-300 font-extrabold">CURE (KEEGAN)</span>
              </span>
            </div>
          </div>

          {/* Countdown indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-5">
            <Clock className="w-4 h-4 text-rose-800 animate-pulse" />
            <span>
              Auto-closing in{' '}
              <strong className="font-mono text-slate-900 font-bold text-sm">{secondsRemaining}s</strong>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Enter Student Tools
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
