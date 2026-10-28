import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCw,
  FileText,
  Plus,
  Download,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { createSampleAcademicPdf, downloadPdfBlob } from '../../utils/samplePdfs';

interface PdfFileItem {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount: number;
  rotation: number; // in degrees: 0, 90, 180, 270
}

interface MergePdfToolProps {
  onBack: () => void;
}

export const MergePdfTool: React.FC<MergePdfToolProps> = ({ onBack }) => {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedSuccess, setMergedSuccess] = useState(false);
  const [outputName, setOutputName] = useState('Custech_Merged_Document.pdf');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);

    for (const file of fileList) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) continue;
      const buffer = await file.arrayBuffer();
      try {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const newItem: PdfFileItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          data: buffer,
          pageCount: doc.getPageCount(),
          rotation: 0,
        };
        setFiles((prev) => [...prev, newItem]);
      } catch (err) {
        console.error('Failed to parse PDF', err);
      }
    }
    setMergedSuccess(false);
    e.target.value = '';
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    try {
      const sample1 = await createSampleAcademicPdf(
        'CSC-301 Lecture Notes: Operating Systems',
        'Part 1: Virtual Memory & Concurrency',
        2
      );
      const sample2 = await createSampleAcademicPdf(
        'CSC-301 Laboratory Report: Kernel Architecture',
        'Part 2: Thread Scheduling & Locks',
        2
      );

      const item1: PdfFileItem = {
        id: 'sample-1',
        name: 'CSC301_Lecture_Notes_Week1.pdf',
        size: sample1.byteLength,
        data: sample1.buffer as ArrayBuffer,
        pageCount: 2,
        rotation: 0,
      };

      const item2: PdfFileItem = {
        id: 'sample-2',
        name: 'CSC301_Lab_Report_P2.pdf',
        size: sample2.byteLength,
        data: sample2.buffer as ArrayBuffer,
        pageCount: 2,
        rotation: 0,
      };

      setFiles((prev) => [...prev, item1, item2]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const newFiles = [...files];
    const [moved] = newFiles.splice(index, 1);
    newFiles.splice(targetIndex, 0, moved);
    setFiles(newFiles);
  };

  const rotateItem = (index: number) => {
    setFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, rotation: (item.rotation + 90) % 360 } : item))
    );
  };

  const removeItem = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const srcDoc = await PDFDocument.load(item.data, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

        for (const page of copiedPages) {
          if (item.rotation !== 0) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + item.rotation));
          }
          mergedPdf.addPage(page);
        }
      }

      const mergedBytes = await mergedPdf.save();
      downloadPdfBlob(mergedBytes, outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`);
      setMergedSuccess(true);
    } catch (err) {
      console.error('Merge failed', err);
      alert('Failed to merge PDFs. Please make sure the files are valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Back button & Title header */}
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
          Load Sample Academic PDFs
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Merge PDF Documents</h2>
        <p className="text-sm text-slate-500 mt-1">
          Combine multiple assignment sheets, research papers, or lecture handouts into a single organized PDF.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="relative border-2 border-dashed border-slate-300 hover:border-rose-400 bg-white rounded-2xl p-8 text-center transition-all cursor-pointer group mb-6">
        <input
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-14 h-14 bg-rose-50 text-rose-900 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
          <Upload className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold text-slate-800">Choose PDF files or drop them here</h4>
        <p className="text-xs text-slate-500 mt-1">Select multiple PDF files to merge together into one document</p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-sm font-bold text-slate-800">
                {files.length} Document{files.length > 1 ? 's' : ''} Ready
              </span>
              <span className="text-xs text-slate-500 ml-2">({totalPages} total pages)</span>
            </div>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {files.map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {file.pageCount} pages · {(file.size / 1024).toFixed(1)} KB
                      {file.rotation !== 0 && ` · Rotated ${file.rotation}°`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button
                    onClick={() => rotateItem(idx)}
                    title="Rotate all pages 90°"
                    className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-white rounded-md transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 rounded-md transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === files.length - 1}
                    title="Move down"
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 rounded-md transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(file.id)}
                    title="Remove"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Configuration & Action Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex-1 max-w-sm">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Output File Name</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleMerge}
              disabled={isProcessing || files.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Merging Documents...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Merge & Download PDF
                </>
              )}
            </button>
          </div>

          {mergedSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Documents merged successfully! Your download has started automatically.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
