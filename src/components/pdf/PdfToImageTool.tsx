import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Download,
  Loader2,
  Archive,
  Eye,
  Check,
} from 'lucide-react';
import { createSampleAcademicPdf } from '../../utils/samplePdfs';
import { renderPdfPages, RenderedPage } from '../../utils/pdfRenderer';

interface PdfToImageToolProps {
  onBack: () => void;
}

export const PdfToImageTool: React.FC<PdfToImageToolProps> = ({ onBack }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [resolution, setResolution] = useState<number>(2.0); // 2x standard high res
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<RenderedPage | null>(null);

  const convertDoc = async (buffer: ArrayBuffer, name: string, scale = resolution) => {
    setIsProcessing(true);
    try {
      setPdfBuffer(buffer);
      setFileName(name);
      const rendered = await renderPdfPages(buffer, undefined, scale);
      setPages(rendered);
      if (rendered.length > 0) setSelectedPreview(rendered[0]);
    } catch (err) {
      console.error(err);
      alert('Error rendering PDF pages to image format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    await convertDoc(buffer, file.name);
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    const sample = await createSampleAcademicPdf(
      'CUSTECH Academic Research Poster & Diagram',
      'Quantum Neural Networks for Graph Representation Learning',
      3
    );
    await convertDoc(sample.buffer as ArrayBuffer, 'Custech_Research_Poster.pdf');
  };

  const downloadSinglePage = (page: RenderedPage) => {
    const cleanBase = fileName.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = page.dataUrl;
    a.download = `${cleanBase}_page_${page.pageNumber}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllAsZip = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const cleanBase = fileName.replace(/\.[^/.]+$/, '');

      for (const page of pages) {
        // Extract base64
        const base64Data = page.dataUrl.split(',')[1];
        zip.file(`${cleanBase}_page_${page.pageNumber}.${format}`, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanBase}_images_bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error building ZIP package.');
    } finally {
      setIsProcessing(false);
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
          Load Sample Research Poster
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">PDF to Image Converter</h2>
        <p className="text-sm text-slate-500 mt-1">
          Convert PDF pages into high-resolution JPG or PNG images for presentation slides, thesis diagrams, and web uploads.
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
            <RefreshCw className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Select PDF document to convert</h4>
          <p className="text-xs text-slate-500 mt-1">Transforms PDF pages into crisp raster graphics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{fileName}</p>
                <p className="text-xs text-slate-500">{pages.length} Pages Converted</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Format selection */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setFormat('png')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      format === 'png' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    onClick={() => setFormat('jpeg')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      format === 'jpeg' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    JPG (Web)
                  </button>
                </div>

                <button
                  onClick={downloadAllAsZip}
                  disabled={isProcessing || pages.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                  Download All as ZIP
                </button>
              </div>
            </div>
          </div>

          {/* Rendered Pages Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {pages.map((p) => (
              <div
                key={p.pageNumber}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Page {p.pageNumber}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{format} Image</span>
                  </div>
                  <div
                    onClick={() => setSelectedPreview(p)}
                    className="aspect-[1/1.3] bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden cursor-pointer hover:opacity-95 transition-opacity flex items-center justify-center p-1"
                  >
                    <img src={p.dataUrl} alt={`Page ${p.pageNumber}`} className="max-h-full object-contain" />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {Math.round(p.width)} x {Math.round(p.height)} px
                  </span>
                  <button
                    onClick={() => downloadSinglePage(p)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
