/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ToolId, MainTab } from './types';
import { PdfToolCardsGrid } from './components/pdf/PdfToolCardsGrid';
import { MergePdfTool } from './components/pdf/MergePdfTool';
import { SplitPdfTool } from './components/pdf/SplitPdfTool';
import { CompressPdfTool } from './components/pdf/CompressPdfTool';
import { SignPdfTool } from './components/pdf/SignPdfTool';
import { EditPdfTool } from './components/pdf/EditPdfTool';
import { PdfToImageTool } from './components/pdf/PdfToImageTool';
import { ImageToPdfTool } from './components/pdf/ImageToPdfTool';
import { AddWatermarkTool } from './components/pdf/AddWatermarkTool';
import { ExtractImagesTool } from './components/pdf/ExtractImagesTool';
import { GpaCalculatorTool } from './components/academic/GpaCalculatorTool';
import { StudyCompanionTool } from './components/academic/StudyCompanionTool';
import { NoticeModal } from './components/NoticeModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('pdf-tools');
  const [activePdfTool, setActivePdfTool] = useState<ToolId | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(true);

  const handleSelectPdfTool = (toolId: ToolId) => {
    setActivePdfTool(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPdfGrid = () => {
    setActivePdfTool(null);
  };

  const renderActivePdfTool = () => {
    switch (activePdfTool) {
      case 'merge':
        return <MergePdfTool onBack={handleBackToPdfGrid} />;
      case 'split':
        return <SplitPdfTool onBack={handleBackToPdfGrid} />;
      case 'compress':
        return <CompressPdfTool onBack={handleBackToPdfGrid} />;
      case 'sign':
        return <SignPdfTool onBack={handleBackToPdfGrid} />;
      case 'edit':
        return <EditPdfTool onBack={handleBackToPdfGrid} />;
      case 'pdf-to-image':
        return <PdfToImageTool onBack={handleBackToPdfGrid} />;
      case 'image-to-pdf':
        return <ImageToPdfTool onBack={handleBackToPdfGrid} />;
      case 'watermark':
        return <AddWatermarkTool onBack={handleBackToPdfGrid} />;
      case 'extract-images':
        return <ExtractImagesTool onBack={handleBackToPdfGrid} />;
      default:
        return <PdfToolCardsGrid onSelectTool={handleSelectPdfTool} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col selection:bg-rose-100 selection:text-rose-900">
      {/* Top Banner / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div
              onClick={() => {
                setCurrentTab('pdf-tools');
                setActivePdfTool(null);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src="/assets/aistudio/1793168465779_fb1efee5.jpg"
                alt="CustechBot Logo"
                className="w-11 h-11 rounded-xl object-contain shadow-xs border border-rose-100 bg-white group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">
                    CustechBot
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-100">
                    Student Companion
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Academic Tools & Client-Side Document Suite
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => {
                  setCurrentTab('pdf-tools');
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'pdf-tools'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PDF Studio
              </button>
              <button
                onClick={() => {
                  setCurrentTab('gpa-calc');
                  setActivePdfTool(null);
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'gpa-calc'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                GPA Calculator
              </button>
              <button
                onClick={() => {
                  setCurrentTab('study-companion');
                  setActivePdfTool(null);
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === 'study-companion'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Planner & Focus
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNoticeModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                title="View Student Disclaimer Notice"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                <span>Notice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-100 bg-slate-50 text-xs">
          <button
            onClick={() => setCurrentTab('pdf-tools')}
            className={`px-3 py-1 font-semibold rounded-lg ${
              currentTab === 'pdf-tools' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            PDF Studio
          </button>
          <button
            onClick={() => {
              setCurrentTab('gpa-calc');
              setActivePdfTool(null);
            }}
            className={`px-3 py-1 font-semibold rounded-lg ${
              currentTab === 'gpa-calc' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            GPA
          </button>
          <button
            onClick={() => {
              setCurrentTab('study-companion');
              setActivePdfTool(null);
            }}
            className={`px-3 py-1 font-semibold rounded-lg ${
              currentTab === 'study-companion' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Planner
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Subtle Security & Privacy Badge */}
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-slate-200/70 text-xs text-slate-500 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Client-Side Privacy:</strong> Documents are processed in your browser sandbox. No coursework is uploaded to remote servers.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            Encrypted WebAssembly Sandbox
          </span>
        </div>

        {/* Tab View */}
        {currentTab === 'pdf-tools' && renderActivePdfTool()}
        {currentTab === 'gpa-calc' && <GpaCalculatorTool />}
        {currentTab === 'study-companion' && <StudyCompanionTool />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/1793168465779_fb1efee5.jpg"
              alt="Logo"
              className="w-5 h-5 rounded-full object-contain border border-slate-200"
            />
            <p>
              © 2026 CustechBot · Created by <strong className="text-slate-800">CURE (KEEGAN)</strong> to assist students.
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setShowNoticeModal(true)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Disclaimer Notice
            </button>
            <span>·</span>
            <span>Client-Side Privacy</span>
          </div>
        </div>
      </footer>

      {/* Pop-up Student Notice Modal (60s countdown & cancel option) */}
      <NoticeModal isOpen={showNoticeModal} onClose={() => setShowNoticeModal(false)} />
    </div>
  );
}
