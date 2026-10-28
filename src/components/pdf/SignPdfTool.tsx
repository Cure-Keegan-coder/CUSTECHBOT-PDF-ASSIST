import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  PenTool,
  Type,
  RotateCcw,
  Download,
  Loader2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { createSampleAcademicPdf, downloadPdfBlob } from '../../utils/samplePdfs';
import { renderSinglePage, RenderedPage } from '../../utils/pdfRenderer';

interface SignPdfToolProps {
  onBack: () => void;
}

export const SignPdfTool: React.FC<SignPdfToolProps> = ({ onBack }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagePreview, setPagePreview] = useState<RenderedPage | null>(null);

  // Signing mode
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState<string>('Alex R. Chen');
  const [fontStyle, setFontStyle] = useState<'handwriting' | 'serif' | 'script'>('handwriting');
  const [inkColor, setInkColor] = useState<string>('#1e293b'); // Dark Slate/Black
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [includeTitle, setIncludeTitle] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [signedSuccess, setSignedSuccess] = useState<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (signMode === 'draw') {
      initCanvas();
    }
  }, [signMode]);

  // Load PDF buffer and generate preview of currentPage
  const loadDoc = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPdfBuffer(buffer);
      setFileName(name);
      setTotalPages(doc.getPageCount());
      setCurrentPage(1);

      const preview = await renderSinglePage(buffer, 1, 1.2);
      setPagePreview(preview);
    } catch (err) {
      console.error(err);
      alert('Unable to load PDF document.');
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
      'CUSTECH Academic Scholarship Application',
      'Undergraduate Engineering Honor Award Verification Form',
      2
    );
    await loadDoc(sample.buffer as ArrayBuffer, 'Custech_Scholarship_Form.pdf');
  };

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = inkColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    initCanvas();
  };

  // Generate PNG data URL of signature
  const getSignaturePngDataUrl = (): string | null => {
    if (signMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    } else {
      // Render typed text to temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 120;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = inkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (fontStyle === 'handwriting') {
        ctx.font = 'bold 44px "Caveat", cursive';
      } else if (fontStyle === 'serif') {
        ctx.font = 'italic 34px "Times New Roman", serif';
      } else {
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      }

      ctx.fillText(typedName || 'Student Signature', 200, 60);
      return tempCanvas.toDataURL('image/png');
    }
  };

  const handleApplySignature = async () => {
    if (!pdfBuffer) return;
    setIsProcessing(true);

    try {
      const sigDataUrl = getSignaturePngDataUrl();
      if (!sigDataUrl) {
        alert('Please draw or type your signature first.');
        setIsProcessing(false);
        return;
      }

      const sigImageBytes = await fetch(sigDataUrl).then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

      const embeddedSig = await pdfDoc.embedPng(sigImageBytes);
      const targetPageIndex = Math.max(0, Math.min(currentPage - 1, pdfDoc.getPageCount() - 1));
      const page = pdfDoc.getPage(targetPageIndex);
      const { width } = page.getSize();

      // Stamp in the bottom-right signature area
      const sigWidth = 160;
      const sigHeight = (embeddedSig.height / embeddedSig.width) * sigWidth;
      const sigX = width - sigWidth - 60;
      const sigY = 90;

      page.drawImage(embeddedSig, {
        x: sigX,
        y: sigY,
        width: sigWidth,
        height: sigHeight,
      });

      // Optional Date & Title stamp
      if (includeDate || includeTitle) {
        const helvetica = await pdfDoc.embedFont('Helvetica');
        const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');

        let textY = sigY - 14;
        if (includeTitle) {
          page.drawText(`Digitally Signed by: ${typedName}`, {
            x: sigX,
            y: textY,
            size: 9,
            font: helveticaBold,
          });
          textY -= 12;
        }

        if (includeDate) {
          const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          page.drawText(`Date: ${dateStr} · CustechBot Verified`, {
            x: sigX,
            y: textY,
            size: 8,
            font: helvetica,
          });
        }
      }

      const signedBytes = await pdfDoc.save();
      const cleanBase = fileName.replace(/\.[^/.]+$/, '');
      downloadPdfBlob(signedBytes, `${cleanBase}_signed.pdf`);
      setSignedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error applying signature to PDF.');
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
          Load Sample Scholarship Form
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign PDF Electronically</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add authenticated signatures, date stamps, and credentials to academic forms, agreements, and thesis approvals.
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
            <PenTool className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Select PDF document to sign</h4>
          <p className="text-xs text-slate-500 mt-1">Secure and strictly client-side: your signature remains private</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Signature creation studio (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              {/* Mode switch */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => setSignMode('draw')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    signMode === 'draw'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Draw Signature
                </button>
                <button
                  onClick={() => setSignMode('type')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    signMode === 'type'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Type Signature
                </button>
              </div>

              {/* Ink color palette */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">Ink Color</span>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#0f172a', label: 'Black' },
                    { color: '#1e40af', label: 'Royal Blue' },
                    { color: '#881337', label: 'Maroon' },
                  ].map((item) => (
                    <button
                      key={item.color}
                      onClick={() => setInkColor(item.color)}
                      style={{ backgroundColor: item.color }}
                      className={`w-6 h-6 rounded-full transition-all ${
                        inkColor === item.color ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : 'opacity-80'
                      }`}
                      title={item.label}
                    />
                  ))}
                </div>
              </div>

              {/* Draw Pad */}
              {signMode === 'draw' ? (
                <div>
                  <div className="border border-slate-200 rounded-xl bg-slate-50 p-2 relative">
                    <canvas
                      ref={canvasRef}
                      width={340}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onMouseMove={draw}
                      onTouchStart={startDrawing}
                      onTouchEnd={stopDrawing}
                      onTouchMove={draw}
                      className="w-full h-36 bg-white rounded-lg cursor-crosshair touch-none border border-slate-100"
                    />
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[11px] text-slate-400">Sign with mouse or stylus</span>
                      <button
                        onClick={clearCanvas}
                        className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Clear Pad
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Name</label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Alex R. Chen"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>

                  {/* Font style picker */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setFontStyle('handwriting')}
                        className={`p-2 text-xs rounded-lg border text-center transition-all ${
                          fontStyle === 'handwriting'
                            ? 'border-rose-900 bg-rose-50/50 text-rose-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-handwriting text-base">Cursive</span>
                      </button>
                      <button
                        onClick={() => setFontStyle('serif')}
                        className={`p-2 text-xs rounded-lg border text-center transition-all ${
                          fontStyle === 'serif'
                            ? 'border-rose-900 bg-rose-50/50 text-rose-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="italic font-serif">Formal</span>
                      </button>
                      <button
                        onClick={() => setFontStyle('script')}
                        className={`p-2 text-xs rounded-lg border text-center transition-all ${
                          fontStyle === 'script'
                            ? 'border-rose-900 bg-rose-50/50 text-rose-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>Modern</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview of typed signature */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p
                      style={{ color: inkColor }}
                      className={
                        fontStyle === 'handwriting'
                          ? 'font-handwriting text-3xl font-bold'
                          : fontStyle === 'serif'
                          ? 'italic font-serif text-2xl'
                          : 'font-semibold text-xl'
                      }
                    >
                      {typedName || 'Signer Name'}
                    </p>
                  </div>
                </div>
              )}

              {/* Extra badges */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDate}
                    onChange={(e) => setIncludeDate(e.target.checked)}
                    className="rounded text-rose-900 focus:ring-rose-500"
                  />
                  <span>Attach current timestamp & verification date</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTitle}
                    onChange={(e) => setIncludeTitle(e.target.checked)}
                    className="rounded text-rose-900 focus:ring-rose-500"
                  />
                  <span>Attach &quot;Digitally Signed by&quot; verification line</span>
                </label>
              </div>

              {/* Target Page Selector */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apply signature to page:
                </label>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Page {num} of {totalPages}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply & Download */}
              <button
                onClick={handleApplySignature}
                disabled={isProcessing}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing Document...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Apply Signature & Download PDF
                  </>
                )}
              </button>

              {signedSuccess && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Signature permanently embedded!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Document Preview (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Preview: Page {currentPage} of {totalPages}
                </span>
                <span className="text-[11px] text-slate-500">Placement: Bottom-right authorized area</span>
              </div>

              <div className="relative border border-slate-200 rounded-xl bg-slate-100 p-3 min-h-[420px] flex items-center justify-center overflow-hidden">
                {pagePreview ? (
                  <div className="relative max-w-full shadow-md bg-white">
                    <img
                      src={pagePreview.dataUrl}
                      alt="Document Page Preview"
                      className="max-h-[500px] w-auto object-contain"
                    />

                    {/* Visual Overlay Pinpoint indicating signature location */}
                    <div className="absolute bottom-6 right-6 border-2 border-dashed border-rose-500 bg-rose-50/70 p-2 rounded-lg pointer-events-none text-right">
                      <p className="text-[10px] font-bold text-rose-900">
                        Signature Box (Page {currentPage})
                      </p>
                      <p className="text-[9px] text-slate-500">Signed with {inkColor}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Page preview loading...</p>
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
