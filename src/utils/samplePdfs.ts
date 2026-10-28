import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createSampleAcademicPdf(title: string, subtitle: string, pageCount = 3): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Header bar
    page.drawRectangle({
      x: 40,
      y: height - 55,
      width: width - 80,
      height: 2,
      color: rgb(0.55, 0.08, 0.18), // Deep burgundy accent
    });

    page.drawText('CUSTECH ACADEMIC PORTAL · STUDENT DOCUMENT SUITE', {
      x: 40,
      y: height - 45,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    if (pageNum === 1) {
      page.drawText(title, {
        x: 40,
        y: height - 110,
        size: 22,
        font: timesBoldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(subtitle, {
        x: 40,
        y: height - 135,
        size: 13,
        font: timesRomanFont,
        color: rgb(0.35, 0.35, 0.35),
      });

      // Metadata block
      page.drawRectangle({
        x: 40,
        y: height - 210,
        width: width - 80,
        height: 60,
        color: rgb(0.97, 0.97, 0.98),
      });

      page.drawText('Course: CSC-301 Advanced Software Systems & Data Structures', {
        x: 55,
        y: height - 170,
        size: 10,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText('Student: Alex R. Chen (ID: 2024-CUS-8842) · Semester: Fall Term', {
        x: 55,
        y: height - 190,
        size: 10,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Sample Academic Paragraphs
      page.drawText('1. Abstract & Problem Statement', {
        x: 40,
        y: height - 250,
        size: 14,
        font: timesBoldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const sampleText1 =
        'This research monograph explores the computational efficiency of modern document manipulation\n' +
        'pipelines running client-side within browser sandbox environments. By leveraging WebAssembly\n' +
        'and JavaScript byte buffers, students can manipulate, merge, annotate, and digitally authenticate\n' +
        'academic coursework without exposing proprietary intellectual property to remote cloud nodes.';

      page.drawText(sampleText1, {
        x: 40,
        y: height - 275,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.25, 0.25, 0.25),
        lineHeight: 16,
      });

      page.drawText('2. Theoretical Framework & Methodology', {
        x: 40,
        y: height - 370,
        size: 14,
        font: timesBoldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const sampleText2 =
        'Standard algorithmic document reconstruction requires stream deserialization, cross-reference\n' +
        'table reconciliation, and font descriptor validation. When executing signature validation,\n' +
        'cryptographic integrity markers guarantee non-repudiation across multi-institution submission\n' +
        'systems, preserving institutional standards across higher education frameworks.';

      page.drawText(sampleText2, {
        x: 40,
        y: height - 395,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.25, 0.25, 0.25),
        lineHeight: 16,
      });
    } else {
      page.drawText(`Section ${pageNum}. Continuing Academic Analysis`, {
        x: 40,
        y: height - 100,
        size: 18,
        font: timesBoldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const bodyText =
        `Page ${pageNum} comprises extended laboratory findings, algorithmic complexity metrics (O(N log N)),\n` +
        `and quantitative citation listings for academic term paper verification.\n\n` +
        `Key Takeaways:\n` +
        `• Empirical validation verifies sub-100ms processing times for merged document structures.\n` +
        `• Lossless PDF image compression yields an average size reduction of 64.2%.\n` +
        `• High-resolution vector stamping preserves 300+ DPI typographic clarity across print and digital screens.`;

      page.drawText(bodyText, {
        x: 40,
        y: height - 140,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.25, 0.25, 0.25),
        lineHeight: 18,
      });
    }

    // Footer
    page.drawText(`Page ${pageNum} of ${pageCount}`, {
      x: width / 2 - 25,
      y: 35,
      size: 9,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText('CustechBot Academic Suite · Confidential Student Record', {
      x: 40,
      y: 35,
      size: 8,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  return await pdfDoc.save();
}

export function downloadPdfBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
