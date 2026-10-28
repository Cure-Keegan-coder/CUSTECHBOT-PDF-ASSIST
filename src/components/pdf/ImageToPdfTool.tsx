import React, { useState } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { downloadPdfBlob } from '../../utils/samplePdfs';

interface ImageItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  buffer: ArrayBuffer;
  width: number;
  height: number;
  isPng: boolean;
}

interface ImageToPdfToolProps {
  onBack: () => void;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [margin, setMargin] = useState<number>(20);
  const [outputName, setOutputName] = useState<string>('Custech_Converted_Images.pdf');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const processImageFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    return new Promise<ImageItem>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            dataUrl,
            buffer,
            width: img.width,
            height: img.height,
            isPng,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);

    const loaded: ImageItem[] = [];
    for (const file of fileList) {
      if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp)$/i.test(file.name)) continue;
      const item = await processImageFile(file);
      loaded.push(item);
    }

    setImages((prev) => [...prev, ...loaded]);
    setSuccess(false);
    e.target.value = '';
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    // Create 2 procedural canvas sample images representing scanned lecture notes & diagram
    const canvas1 = document.createElement('canvas');
    canvas1.width = 1200;
    canvas1.height = 1600;
    const ctx1 = canvas1.getContext('2d')!;
    ctx1.fillStyle = '#ffffff';
    ctx1.fillRect(0, 0, 1200, 1600);

    ctx1.fillStyle = '#881337';
    ctx1.fillRect(60, 60, 1080, 8);

    ctx1.fillStyle = '#0f172a';
    ctx1.font = 'bold 44px sans-serif';
    ctx1.fillText('CUSTECH · CSC-301 Lecture Graph Analysis', 60, 130);

    ctx1.fillStyle = '#475569';
    ctx1.font = '24px sans-serif';
    ctx1.fillText('Diagram 1: Bipartite Graph Matching & Matrix Decomposition', 60, 180);

    // Draw some chart lines
    ctx1.strokeStyle = '#991b1b';
    ctx1.lineWidth = 4;
    ctx1.strokeRect(80, 240, 1040, 600);

    ctx1.fillStyle = '#f8fafc';
    ctx1.fillRect(82, 242, 1036, 596);

    ctx1.fillStyle = '#1e293b';
    ctx1.font = '28px sans-serif';
    ctx1.fillText('Graph Flow Algorithm · Node Convergence Matrix', 120, 320);

    const blob1 = await new Promise<Blob>((res) => canvas1.toBlob((b) => res(b!), 'image/png'));
    const item1 = await processImageFile(new File([blob1], 'Lecture_Graph_Notes.png', { type: 'image/png' }));

    setImages((prev) => [...prev, item1]);
    setIsProcessing(false);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setImages(copy);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        let embeddedImage;
        if (item.isPng) {
          embeddedImage = await pdfDoc.embedPng(item.buffer);
        } else {
          // If JPEG or other format, convert canvas if necessary or embedJpg
          try {
            embeddedImage = await pdfDoc.embedJpg(item.buffer);
          } catch {
            // Convert to png buffer via canvas if format is webp/other
            const tempImg = new Image();
            tempImg.src = item.dataUrl;
            await new Promise((res) => (tempImg.onload = res));
            const c = document.createElement('canvas');
            c.width = tempImg.width;
            c.height = tempImg.height;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(tempImg, 0, 0);
            const pngBlob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'));
            const pngBuf = await pngBlob.arrayBuffer();
            embeddedImage = await pdfDoc.embedPng(pngBuf);
          }
        }

        let pageWidth = item.width;
        let pageHeight = item.height;

        if (pageSize === 'a4') {
          [pageWidth, pageHeight] = PageSizes.A4;
        } else if (pageSize === 'letter') {
          [pageWidth, pageHeight] = PageSizes.Letter;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (pageSize === 'fit') {
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });
        } else {
          // Scale to fit inside margins
          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          const scaleRatio = Math.min(
            availableWidth / embeddedImage.width,
            availableHeight / embeddedImage.height
          );

          const drawWidth = embeddedImage.width * scaleRatio;
          const drawHeight = embeddedImage.height * scaleRatio;

          const drawX = (pageWidth - drawWidth) / 2;
          const drawY = (pageHeight - drawHeight) / 2;

          page.drawImage(embeddedImage, {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      downloadPdfBlob(pdfBytes, outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error creating PDF from images.');
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
          Load Sample Scanned Notes
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Image to PDF Converter</h2>
        <p className="text-sm text-slate-500 mt-1">
          Turn textbook scans, whiteboard snapshots, and diagram photos into a unified, clean academic PDF document.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="relative border-2 border-dashed border-slate-300 hover:border-rose-400 bg-white rounded-2xl p-8 text-center transition-all cursor-pointer group mb-6">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-14 h-14 bg-rose-50 text-rose-900 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold text-slate-800">Select images (JPG, PNG, WebP)</h4>
        <p className="text-xs text-slate-500 mt-1">Upload multiple photos to combine into a multi-page PDF</p>
      </div>

      {/* Images list and settings */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">{images.length} Image(s) Attached</span>
            <button
              onClick={() => setImages([])}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Image cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-[4/3] bg-white rounded-lg overflow-hidden border border-slate-200/80 mb-2 flex items-center justify-center">
                    <img src={img.dataUrl} alt={img.name} className="max-h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Page {idx + 1}</span>
                    <span className="text-slate-400">
                      {img.width}x{img.height}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{img.name}</p>
                </div>

                <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => moveImage(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveImage(idx, 'down')}
                    disabled={idx === images.length - 1}
                    className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-1 hover:bg-white rounded text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Page Format</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="a4">A4 (Standard Academic)</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Margins</label>
              <select
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value={0}>No Margin (Edge-to-Edge)</option>
                <option value={20}>Small (20pt)</option>
                <option value={36}>Standard (36pt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Output Name</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleGeneratePdf}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Convert & Download PDF
                </>
              )}
            </button>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PDF successfully created and downloaded!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
