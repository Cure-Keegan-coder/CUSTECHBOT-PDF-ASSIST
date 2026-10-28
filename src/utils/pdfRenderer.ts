import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use official CDN worker matching loaded version or fallback
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
}

export interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export async function renderPdfPages(
  fileData: ArrayBuffer | Uint8Array,
  maxPages?: number,
  scale = 1.5
): Promise<RenderedPage[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(fileData),
      cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = maxPages ? Math.min(pdfDoc.numPages, maxPages) : pdfDoc.numPages;
    const results: RenderedPage[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page
      await (page.render as any)({
        canvasContext: context,
        canvas,
        viewport,
      }).promise;

      results.push({
        pageNumber: i,
        dataUrl: canvas.toDataURL('image/png'),
        width: viewport.width,
        height: viewport.height,
      });
    }

    return results;
  } catch (error) {
    console.warn('PDF.js rendering fallback triggered:', error);
    return [];
  }
}

export async function renderSinglePage(
  fileData: ArrayBuffer | Uint8Array,
  pageNumber = 1,
  scale = 1.5
): Promise<RenderedPage | null> {
  const pages = await renderPdfPages(fileData, pageNumber, scale);
  const target = pages.find((p) => p.pageNumber === pageNumber);
  return target || pages[0] || null;
}
