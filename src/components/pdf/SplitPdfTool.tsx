import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  Scissors,
  Check,
  Download,
  Loader2,
  Archive,
  FileCheck,
} from 'lucide-react';
import { createSampleAcademicPdf, downloadPdfBlob } from '../../utils/samplePdfs';
import { renderPdfPages, RenderedPage } from '../../utils/pdfRenderer';

interface SplitPdfToolProps {
  onBack: () => void;
}

export const SplitPdfTool: React.FC<SplitPdfToolProps> = ({ onBack }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [renderedThumbnails, setRenderedThumbnails] = useState<RenderedPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'extract' | 'all-zip'>('extract');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const loadBuffer = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    setStatusMessage('Reading PDF pages and generating visual previews...');
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pagesCount = doc.getPageCount();
      setPdfBuffer(buffer);
      setFileName(name);
      setTotalPages(pagesCount);

      // Default select all or first page
      setSelectedPages([1]);
      setRangeInput('1');

      // Generate visual thumbnails via pdfRenderer
      const thumbnails = await renderPdfPages(buffer, 20, 0.7);
      setRenderedThumbnails(thumbnails);
      setStatusMessage('');
    } catch (err) {
      console.error(err);
      alert('Unable to load the PDF. Please check the file.');
      setStatusMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    await loadBuffer(buffer, file.name);
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    const sample = await createSampleAcademicPdf(
      'CUSTECH Term Thesis: Distributed Systems',
      'Department of Computer Science & Engineering',
      5
    );
    await loadBuffer(sample.buffer as ArrayBuffer, 'Custech_Sample_Thesis_5Pages.pdf');
  };

  const togglePageSelection = (pageNum: number) => {
    let next: number[];
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter((p) => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    setSelectedPages(next);
    setRangeInput(next.join(', '));
  };

  const handleRangeInputChange = (input: string) => {
    setRangeInput(input);
    const pages: Set<number> = new Set();
    const parts = input.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            pages.add(i);
          }
        }
      } else {
        const val = parseInt(part, 10);
        if (!isNaN(val) && val >= 1 && val <= totalPages) {
          pages.add(val);
        }
      }
    }
    setSelectedPages(Array.from(pages).sort((a, b) => a - b));
  };

  const selectAllPages = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(all);
    setRangeInput(`1-${totalPages}`);
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const handleSplit = async () => {
    if (!pdfBuffer) return;
    setIsProcessing(true);

    try {
      const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

      if (splitMode === 'extract') {
        if (selectedPages.length === 0) {
          alert('Please select at least one page to extract.');
          setIsProcessing(false);
          return;
        }

        const newDoc = await PDFDocument.create();
        const zeroIndexedPages = selectedPages.map((p) => p - 1);
        const copied = await newDoc.copyPages(srcDoc, zeroIndexedPages);
        copied.forEach((page) => newDoc.addPage(page));

        const outputBytes = await newDoc.save();
        const cleanBase = fileName.replace(/\.[^/.]+$/, '');
        downloadPdfBlob(outputBytes, `${cleanBase}_extracted_pages.pdf`);
      } else {
        // Split each page into individual files packaged in ZIP
        setStatusMessage('Creating ZIP archive of individual pages...');
        const zip = new JSZip();
        const baseName = fileName.replace(/\.[^/.]+$/, '');

        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
          singleDoc.addPage(copiedPage);
          const bytes = await singleDoc.save();
          zip.file(`${baseName}_page_${i + 1}.pdf`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_split_pages.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert('Error during splitting process.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to PDF Studio
        </button>
        <button
          onClick={handleLoadSample}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Sample Academic Thesis
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Split PDF Documents</h2>
        <p className="text-sm text-slate-500 mt-1">
          Extract specific chapters, select individual homework problem pages, or break large PDFs into separate files.
        </p>
      </div>

      {!pdfBuffer ? (
        <div className="relative border-2 border-dashed border-slate-300 hover:border-rose-400 bg-white rounded-2xl p-10 text-center transition-all cursor-pointer group">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-14 h-14 bg-rose-50 text-rose-900 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Scissors className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Select a PDF to split</h4>
          <p className="text-xs text-slate-500 mt-1">Click to browse or drop an academic PDF file here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{fileName}</p>
                <p className="text-xs text-slate-500">
                  {totalPages} Total Pages · {selectedPages.length} Pages Selected
                </p>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSplitMode('extract')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    splitMode === 'extract'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Extract Selected Pages
                </button>
                <button
                  onClick={() => setSplitMode('all-zip')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    splitMode === 'all-zip'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Split All as ZIP
                </button>
              </div>
            </div>

            {/* Range Input & Fast Actions */}
            {splitMode === 'extract' && (
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-md">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Page Range (e.g. 1-2, 4)
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => handleRangeInputChange(e.target.value)}
                    placeholder="e.g. 1, 3-5"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <button
                    onClick={selectAllPages}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-md"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllPages}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-md"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visual Page Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-4">Click pages to include in the output:</h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = selectedPages.includes(pageNum);
                const thumb = renderedThumbnails.find((t) => t.pageNumber === pageNum);

                return (
                  <div
                    key={pageNum}
                    onClick={() => togglePageSelection(pageNum)}
                    className={`relative rounded-xl border-2 p-2 cursor-pointer transition-all flex flex-col items-center bg-slate-50 hover:bg-slate-100 ${
                      isSelected
                        ? 'border-rose-900 bg-rose-50/40 shadow-xs'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`absolute top-3 right-3 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-rose-900 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Thumbnail render or preview skeleton */}
                    <div className="w-full aspect-[1/1.4] bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center my-1 shadow-2xs">
                      {thumb ? (
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${pageNum}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <FileCheck className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <span className="text-[10px] text-slate-400">Page {pageNum}</span>
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-slate-700 mt-1">Page {pageNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setPdfBuffer(null);
                  setRenderedThumbnails([]);
                  setSelectedPages([]);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Change Document
              </button>

              <button
                onClick={handleSplit}
                disabled={isProcessing || (splitMode === 'extract' && selectedPages.length === 0)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Pages...
                  </>
                ) : splitMode === 'extract' ? (
                  <>
                    <Download className="w-4 h-4" />
                    Download Extracted ({selectedPages.length} pages)
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Download All as ZIP Archive
                  </>
                )}
              </button>
            </div>
            {statusMessage && (
              <p className="text-xs text-rose-700 font-medium text-right mt-2">{statusMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
