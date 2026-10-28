import React, { useState } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  Droplet,
  Download,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { createSampleAcademicPdf, downloadPdfBlob } from '../../utils/samplePdfs';
import { renderSinglePage, RenderedPage } from '../../utils/pdfRenderer';

interface AddWatermarkToolProps {
  onBack: () => void;
}

export const AddWatermarkTool: React.FC<AddWatermarkToolProps> = ({ onBack }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pagePreview, setPagePreview] = useState<RenderedPage | null>(null);

  // Watermark parameters
  const [watermarkText, setWatermarkText] = useState<string>('STUDENT SUBMISSION - CONFIDENTIAL');
  const [angle, setAngle] = useState<number>(-45);
  const [opacity, setOpacity] = useState<number>(0.28);
  const [fontSize, setFontSize] = useState<number>(36);
  const [colorHex, setColorHex] = useState<string>('#991b1b'); // Deep wine
  const [position, setPosition] = useState<'center' | 'header' | 'footer'>('center');
  const [pagesScope, setPagesScope] = useState<'all' | 'first'>('all');

  const [isProcessing, setIsProcessing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadDoc = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPdfBuffer(buffer);
      setFileName(name);
      setTotalPages(doc.getPageCount());

      const preview = await renderSinglePage(buffer, 1, 1.2);
      setPagePreview(preview);
    } catch (err) {
      console.error(err);
      alert('Unable to load PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    await loadDoc(buffer, file.name);
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    const sample = await createSampleAcademicPdf(
      'CUSTECH Academic Research Manuscript',
      'Peer-Reviewed Pre-Print Submission for Faculty Review',
      3
    );
    await loadDoc(sample.buffer as ArrayBuffer, 'Custech_Manuscript_Review.pdf');
  };

  const hexToRgbValues = (hex: string) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255,
    };
  };

  const handleApplyWatermark = async () => {
    if (!pdfBuffer) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgbValues(colorHex);

      const pageCount = pdfDoc.getPageCount();
      const targetIndices = pagesScope === 'first' ? [0] : Array.from({ length: pageCount }, (_, i) => i);

      for (const idx of targetIndices) {
        const page = pdfDoc.getPage(idx);
        const { width, height } = page.getSize();
        const textWidth = helveticaBold.widthOfTextAtSize(watermarkText, fontSize);

        let x = (width - textWidth) / 2;
        let y = height / 2;

        if (position === 'header') {
          y = height - 60;
        } else if (position === 'footer') {
          y = 50;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font: helveticaBold,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(position === 'center' ? angle : 0),
        });
      }

      const watermarkedBytes = await pdfDoc.save();
      const cleanBase = fileName.replace(/\.[^/.]+$/, '');
      downloadPdfBlob(watermarkedBytes, `${cleanBase}_watermarked.pdf`);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error stamping watermark on PDF.');
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
          Load Sample Manuscript
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Add Watermark to PDF</h2>
        <p className="text-sm text-slate-500 mt-1">
          Stamp security notices, confidentiality headers, or copyright watermarks across all pages with custom transparency.
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
            <Droplet className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Select PDF document to watermark</h4>
          <p className="text-xs text-slate-500 mt-1">Embed custom text stamps directly into document streams</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'STUDENT SUBMISSION',
                  'CONFIDENTIAL',
                  'DRAFT ONLY',
                  'DO NOT DISTRIBUTE',
                ].map((txt) => (
                  <button
                    key={txt}
                    onClick={() => setWatermarkText(txt)}
                    className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Sliders: Opacity & Font Size */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Opacity</span>
                    <span>{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.8"
                    step="0.02"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-rose-900 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Font Size</span>
                    <span>{fontSize} pt</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Position and Color */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="center">Center Diagonal</option>
                    <option value="header">Top Header</option>
                    <option value="footer">Bottom Footer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { color: '#991b1b', name: 'Wine' },
                      { color: '#475569', name: 'Muted Slate' },
                      { color: '#1e40af', name: 'Blue' },
                      { color: '#0f172a', name: 'Dark' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setColorHex(c.color)}
                        style={{ backgroundColor: c.color }}
                        className={`w-6 h-6 rounded-full transition-all ${
                          colorHex === c.color ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : ''
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Page scope */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Pages</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={pagesScope === 'all'}
                      onChange={() => setPagesScope('all')}
                      className="text-rose-900"
                    />
                    <span>All {totalPages} Pages</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={pagesScope === 'first'}
                      onChange={() => setPagesScope('first')}
                      className="text-rose-900"
                    />
                    <span>First Page Only</span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyWatermark}
                disabled={isProcessing}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Stamping Watermark...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Apply & Download PDF
                  </>
                )}
              </button>

              {savedSuccess && (
                <div className="mt-2.5 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Watermark applied and downloaded!</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Column (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">Real-Time Visual Watermark Preview</span>
                <span className="text-[11px] text-slate-400">Live Canvas Emulation</span>
              </div>

              <div className="relative border border-slate-200 rounded-xl bg-slate-100 p-3 min-h-[440px] flex items-center justify-center overflow-hidden">
                {pagePreview ? (
                  <div className="relative max-w-full shadow-md bg-white select-none">
                    <img
                      src={pagePreview.dataUrl}
                      alt="Watermark Preview Page"
                      className="max-h-[500px] w-auto object-contain"
                    />

                    {/* Live Watermark Overlay Element */}
                    <div
                      style={{
                        color: colorHex,
                        opacity,
                        fontSize: `${fontSize * 0.75}px`,
                        transform:
                          position === 'center'
                            ? `translate(-50%, -50%) rotate(${angle}deg)`
                            : position === 'header'
                            ? 'translate(-50%, 0)'
                            : 'translate(-50%, 0)',
                        top: position === 'center' ? '50%' : position === 'header' ? '40px' : 'auto',
                        bottom: position === 'footer' ? '40px' : 'auto',
                        left: '50%',
                      }}
                      className="absolute font-extrabold tracking-wider whitespace-nowrap pointer-events-none drop-shadow-xs"
                    >
                      {watermarkText}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Droplet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Loading page preview...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
