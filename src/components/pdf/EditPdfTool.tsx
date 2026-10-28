import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  Edit3,
  Download,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { createSampleAcademicPdf, downloadPdfBlob } from '../../utils/samplePdfs';
import { renderSinglePage, RenderedPage } from '../../utils/pdfRenderer';

interface AnnotationItem {
  id: string;
  type: 'text' | 'date' | 'stamp';
  text: string;
  page: number;
  xPercent: number; // 0 to 100% of page width
  yPercent: number; // 0 to 100% of page height from bottom
  color: string;
  size: number;
  hasBackground: boolean;
}

interface EditPdfToolProps {
  onBack: () => void;
}

export const EditPdfTool: React.FC<EditPdfToolProps> = ({ onBack }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [pagePreview, setPagePreview] = useState<RenderedPage | null>(null);

  // New annotation draft
  const [newText, setNewText] = useState<string>('Prof. Note: Approved for final submission');
  const [annotationColor, setAnnotationColor] = useState<string>('#991b1b'); // Dark red / rose
  const [fontSize, setFontSize] = useState<number>(12);
  const [hasBackground, setHasBackground] = useState<boolean>(true);

  // Existing placed annotations
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadDoc = async (buffer: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPdfBuffer(buffer);
      setFileName(name);
      setTotalPages(doc.getPageCount());
      setActivePage(1);

      const preview = await renderSinglePage(buffer, 1, 1.2);
      setPagePreview(preview);
    } catch (err) {
      console.error(err);
      alert('Unable to read PDF file.');
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
      'CUSTECH Final Examination · Architecture Term Paper',
      'Department of Computer Science & Software Engineering',
      3
    );
    await loadDoc(sample.buffer as ArrayBuffer, 'Custech_Term_Paper_Exam.pdf');
  };

  const handlePageChange = async (newPage: number) => {
    setActivePage(newPage);
    if (!pdfBuffer) return;
    const preview = await renderSinglePage(pdfBuffer, newPage, 1.2);
    setPagePreview(preview);
  };

  const addTextAnnotation = () => {
    if (!newText.trim()) return;
    const item: AnnotationItem = {
      id: `${Date.now()}`,
      type: 'text',
      text: newText,
      page: activePage,
      xPercent: 12,
      yPercent: 78,
      color: annotationColor,
      size: fontSize,
      hasBackground,
    };
    setAnnotations((prev) => [...prev, item]);
  };

  const addDateStamp = () => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const item: AnnotationItem = {
      id: `${Date.now()}`,
      type: 'date',
      text: `Reviewed: ${today}`,
      page: activePage,
      xPercent: 70,
      yPercent: 92,
      color: '#0f172a',
      size: 10,
      hasBackground: true,
    };
    setAnnotations((prev) => [...prev, item]);
  };

  const addAcademicStamp = (stampText: string, color: string) => {
    const item: AnnotationItem = {
      id: `${Date.now()}`,
      type: 'stamp',
      text: stampText,
      page: activePage,
      xPercent: 68,
      yPercent: 82,
      color,
      size: 14,
      hasBackground: true,
    };
    setAnnotations((prev) => [...prev, item]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  // Convert hex color to rgb
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
  };

  const handleSaveAndDownload = async () => {
    if (!pdfBuffer) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const ann of annotations) {
        const pageIndex = ann.page - 1;
        if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;

        const page = pdfDoc.getPage(pageIndex);
        const { width, height } = page.getSize();

        const x = (ann.xPercent / 100) * width;
        const y = (ann.yPercent / 100) * height;

        const textFont = ann.type === 'stamp' ? helveticaBold : helvetica;
        const textWidth = textFont.widthOfTextAtSize(ann.text, ann.size);
        const textHeight = ann.size;

        // Draw background highlight box if enabled
        if (ann.hasBackground) {
          const bgPadding = 4;
          const isStamp = ann.type === 'stamp';
          page.drawRectangle({
            x: x - bgPadding,
            y: y - bgPadding,
            width: textWidth + bgPadding * 2,
            height: textHeight + bgPadding * 2,
            color: isStamp ? rgb(0.98, 0.94, 0.95) : rgb(0.99, 0.98, 0.88),
            borderColor: hexToRgb(ann.color),
            borderWidth: isStamp ? 1.5 : 0.5,
          });
        }

        page.drawText(ann.text, {
          x,
          y,
          size: ann.size,
          font: textFont,
          color: hexToRgb(ann.color),
        });
      }

      const editedBytes = await pdfDoc.save();
      const cleanBase = fileName.replace(/\.[^/.]+$/, '');
      downloadPdfBlob(editedBytes, `${cleanBase}_annotated.pdf`);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error updating and downloading the edited PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pageAnnotations = annotations.filter((a) => a.page === activePage);

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
          Load Sample Academic Paper
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit & Annotate PDF</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add notes, submission dates, reviewer remarks, and grading stamps onto PDF lecture notes and submissions.
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
            <Edit3 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">Select PDF document to annotate</h4>
          <p className="text-xs text-slate-500 mt-1">Add text annotations, corrections, and stamps to pages</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Annotation Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Add Note or Annotation</h4>

              {/* Text note input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Annotation Text</label>
                  <textarea
                    rows={2}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter annotation note..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Font Size</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value={10}>10pt - Small Note</option>
                      <option value={12}>12pt - Standard</option>
                      <option value={14}>14pt - Medium</option>
                      <option value={18}>18pt - Large Title</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Highlight Color</label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[
                        { color: '#991b1b', name: 'Burgundy' },
                        { color: '#1e40af', name: 'Navy' },
                        { color: '#047857', name: 'Emerald' },
                        { color: '#0f172a', name: 'Dark' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          onClick={() => setAnnotationColor(c.color)}
                          style={{ backgroundColor: c.color }}
                          className={`w-6 h-6 rounded-full transition-all ${
                            annotationColor === c.color ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : ''
                          }`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-bg"
                    checked={hasBackground}
                    onChange={(e) => setHasBackground(e.target.checked)}
                    className="rounded text-rose-900"
                  />
                  <label htmlFor="chk-bg" className="text-xs text-slate-600 cursor-pointer">
                    Add highlight background box
                  </label>
                </div>

                <button
                  onClick={addTextAnnotation}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Place Note on Page {activePage}
                </button>
              </div>

              {/* Fast academic preset stamps */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-2">Quick Academic Stamps</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addAcademicStamp('GRADE: A+ (EXCELLENT)', '#047857')}
                    className="p-2 text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Grade A+ (Passed)
                  </button>
                  <button
                    onClick={() => addAcademicStamp('APPROVED FOR SUBMISSION', '#1e40af')}
                    className="p-2 text-left bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Approved Stamp
                  </button>
                  <button
                    onClick={addDateStamp}
                    className="p-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-3 h-3" />
                    Date Stamp
                  </button>
                  <button
                    onClick={() => addAcademicStamp('REVISION REQUESTED', '#991b1b')}
                    className="p-2 text-left bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Revision Req.
                  </button>
                </div>
              </div>

              {/* List of active annotations */}
              {annotations.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Annotations ({annotations.length})
                    </span>
                    <button
                      onClick={() => setAnnotations([])}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-slate-500 mr-1.5">P.{ann.page}</span>
                          <span className="text-slate-800">{ann.text}</span>
                        </div>
                        <button
                          onClick={() => removeAnnotation(ann.id)}
                          className="text-slate-400 hover:text-red-600 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSaveAndDownload}
                disabled={isProcessing}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Baking Annotations...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Annotated PDF
                  </>
                )}
              </button>

              {savedSuccess && (
                <div className="mt-2.5 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Annotations successfully saved into PDF!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Page Viewer & Visual Preview (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Page {activePage} of {totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => handlePageChange(num)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        activePage === num
                          ? 'bg-rose-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual page with overlaid annotations */}
              <div className="relative border border-slate-200 rounded-xl bg-slate-100 p-3 min-h-[440px] flex items-center justify-center overflow-hidden">
                {pagePreview ? (
                  <div className="relative max-w-full shadow-md bg-white">
                    <img
                      src={pagePreview.dataUrl}
                      alt={`Page ${activePage}`}
                      className="max-h-[500px] w-auto object-contain"
                    />

                    {/* Render page-specific annotations over visual preview */}
                    {pageAnnotations.map((ann) => (
                      <div
                        key={ann.id}
                        style={{
                          left: `${ann.xPercent}%`,
                          bottom: `${ann.yPercent}%`,
                          color: ann.color,
                        }}
                        className={`absolute -translate-y-1/2 px-2 py-0.5 rounded text-xs font-semibold shadow-xs select-none pointer-events-none ${
                          ann.hasBackground
                            ? ann.type === 'stamp'
                              ? 'bg-rose-50 border border-rose-300'
                              : 'bg-yellow-100 border border-yellow-300'
                            : ''
                        }`}
                      >
                        {ann.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
