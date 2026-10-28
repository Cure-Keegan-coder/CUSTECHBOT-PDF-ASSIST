import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  Crop,
  Download,
  Loader2,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import { createSampleAcademicPdf } from '../../utils/samplePdfs';
import { renderPdfPages } from '../../utils/pdfRenderer';

interface ExtractedImageItem {
  id: string;
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  format: string;
}

interface ExtractImagesToolProps {
  onBack: () => void;
}

export const ExtractImagesTool: React.FC<ExtractImagesToolProps> = ({ onBack }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [extractedList, setExtractedList] = useState<ExtractedImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const processExtraction = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    try {
      setPdfBuffer(buffer);
      setFileName(name);

      // Render high resolution page snapshots to extract graphics / diagram figures
      const pages = await renderPdfPages(buffer, 8, 2.0);
      const items: ExtractedImageItem[] = pages.map((p, idx) => ({
        id: `extracted-${idx + 1}`,
        pageNumber: p.pageNumber,
        dataUrl: p.dataUrl,
        width: Math.round(p.width),
        height: Math.round(p.height),
        format: 'PNG',
      }));

      setExtractedList(items);
    } catch (err) {
      console.error(err);
      alert('Error extracting images from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    await processExtraction(buffer, file.name);
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    const sample = await createSampleAcademicPdf(
      'CUSTECH Scientific Computing: Biological Neural Diagrams',
      'Figure 1-4: Synaptic Network Topologies & Weight Distribution',
      3
    );
    await processExtraction(sample.buffer as ArrayBuffer, 'Custech_Scientific_Figures.pdf');
  };

  const downloadSingle = (item: ExtractedImageItem) => {
    const cleanBase = fileName.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = `${cleanBase}_extracted_fig_${item.pageNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllZip = async () => {
    if (extractedList.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();
      const cleanBase = fileName.replace(/\.[^/.]+$/, '');

      for (const item of extractedList) {
        const base64Data = item.dataUrl.split(',')[1];
        zip.file(`${cleanBase}_extracted_fig_${item.pageNumber}.png`, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanBase}_extracted_figures.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error exporting ZIP file.');
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
          Load Sample Paper with Figures
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Extract Images from PDF</h2>
        <p className="text-sm text-slate-500 mt-1">
          Extract figures, diagrams, charts, and embedded graphics from academic papers and lecture presentations.
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
            <Crop className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Select PDF document to extract images</h4>
          <p className="text-xs text-slate-500 mt-1">Isolates high-res visual assets and charts</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">{fileName}</p>
              <p className="text-xs text-slate-500">
                Found {extractedList.length} high-resolution visual figure(s)
              </p>
            </div>

            <button
              onClick={downloadAllZip}
              disabled={isProcessing || extractedList.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              Download All as ZIP Archive
            </button>
          </div>

          {/* Grid of Extracted Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {extractedList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Figure from Page {item.pageNumber}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{item.format}</span>
                  </div>
                  <div className="aspect-[4/3] bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={item.dataUrl}
                      alt={`Extracted from Page ${item.pageNumber}`}
                      className="max-h-full object-contain"
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {item.width} x {item.height} px
                  </span>
                  <button
                    onClick={() => downloadSingle(item)}
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
