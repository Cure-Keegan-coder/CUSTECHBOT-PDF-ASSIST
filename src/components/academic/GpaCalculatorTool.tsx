import React, { useState } from 'react';
import { Plus, Trash2, GraduationCap, Award, Calculator, Download } from 'lucide-react';
import { AcademicCourse } from '../../types';
import { downloadPdfBlob } from '../../utils/samplePdfs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const GpaCalculatorTool: React.FC = () => {
  const [gradingScale, setGradingScale] = useState<4 | 5>(4);
  const [courses, setCourses] = useState<AcademicCourse[]>([
    { id: '1', code: 'CSC-301', name: 'Data Structures & Algorithms', credits: 4, grade: 'A' },
    { id: '2', code: 'MAT-205', name: 'Linear Algebra & Matrices', credits: 3, grade: 'A-' },
    { id: '3', code: 'ENG-210', name: 'Technical Academic Writing', credits: 2, grade: 'B+' },
    { id: '4', code: 'PHY-102', name: 'Applied Electromagnetism', credits: 3, grade: 'B' },
  ]);

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [newGrade, setNewGrade] = useState('A');

  const gradePoints4: Record<string, number> = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    F: 0.0,
  };

  const gradePoints5: Record<string, number> = {
    'A+': 5.0,
    A: 5.0,
    'A-': 4.5,
    'B+': 4.0,
    B: 3.5,
    'B-': 3.0,
    'C+': 2.5,
    C: 2.0,
    'C-': 1.5,
    'D+': 1.0,
    D: 0.5,
    F: 0.0,
  };

  const currentScale = gradingScale === 4 ? gradePoints4 : gradePoints5;

  const totalCredits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
  const totalQualityPoints = courses.reduce((acc, c) => {
    const pts = currentScale[c.grade] ?? 0;
    return acc + pts * (Number(c.credits) || 0);
  }, 0);

  const calculatedGpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '0.00';

  const addCourse = () => {
    if (!newCode.trim() && !newName.trim()) return;
    const item: AcademicCourse = {
      id: `${Date.now()}`,
      code: newCode.trim().toUpperCase() || 'COURSE',
      name: newName.trim() || 'Academic Unit',
      credits: Number(newCredits) || 1,
      grade: newGrade,
    };
    setCourses([...courses, item]);
    setNewCode('');
    setNewName('');
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const exportReportPdf = async () => {
    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

      // Header
      page.drawText('CUSTECHBOT ACADEMIC PORTAL · OFFICIAL GPA REPORT', {
        x: 40,
        y: 790,
        size: 14,
        font: fontBold,
        color: rgb(0.55, 0.08, 0.18),
      });

      page.drawText(`Semester Calculated GPA: ${calculatedGpa} / ${gradingScale}.00`, {
        x: 40,
        y: 760,
        size: 18,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(`Total Credit Units: ${totalCredits}  |  Grading Scale: ${gradingScale}.0 Max`, {
        x: 40,
        y: 740,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Table Header
      let y = 690;
      page.drawText('Course Code', { x: 40, y, size: 10, font: fontBold });
      page.drawText('Course Title', { x: 130, y, size: 10, font: fontBold });
      page.drawText('Credits', { x: 380, y, size: 10, font: fontBold });
      page.drawText('Grade', { x: 450, y, size: 10, font: fontBold });
      page.drawText('Points', { x: 510, y, size: 10, font: fontBold });

      page.drawLine({
        start: { x: 40, y: y - 5 },
        end: { x: 550, y: y - 5 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      y -= 25;
      for (const c of courses) {
        const pts = (currentScale[c.grade] ?? 0) * c.credits;
        page.drawText(c.code, { x: 40, y, size: 9, font });
        page.drawText(c.name.substring(0, 36), { x: 130, y, size: 9, font });
        page.drawText(c.credits.toString(), { x: 390, y, size: 9, font });
        page.drawText(c.grade, { x: 455, y, size: 9, font });
        page.drawText(pts.toFixed(1), { x: 515, y, size: 9, font });
        y -= 20;
      }

      const bytes = await pdf.save();
      downloadPdfBlob(bytes, 'Custech_GPA_Summary_Report.pdf');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Academic GPA & CGPA Calculator</h2>
          <p className="text-sm text-slate-500 mt-1">
            Calculate your term GPA and cumulative standing with customizable 4.0 or 5.0 grading scales.
          </p>
        </div>

        {/* Scale Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setGradingScale(4)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              gradingScale === 4 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            4.00 Scale (US/Standard)
          </button>
          <button
            onClick={() => setGradingScale(5)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              gradingScale === 5 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            5.00 Scale (Honors/Global)
          </button>
        </div>
      </div>

      {/* GPA Score Card Banner */}
      <div className="bg-gradient-to-r from-rose-900 to-rose-950 text-white rounded-3xl p-6 md:p-8 mb-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold tracking-wider text-rose-200 uppercase">
              Current Semester Standing
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-5xl md:text-6xl font-extrabold tracking-tight">{calculatedGpa}</span>
              <span className="text-rose-200 text-lg">/ {gradingScale}.00</span>
            </div>
            <p className="text-xs text-rose-100/80 mt-2">
              Based on {courses.length} enrolled courses totaling {totalCredits} credit hours.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportReportPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-rose-950 hover:bg-rose-50 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Official GPA PDF
            </button>
          </div>
        </div>
      </div>

      {/* Add Course Form & Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3">Add Academic Course</h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Code (e.g. CSC-301)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Course Title (e.g. Algorithms)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min="1"
                max="12"
                placeholder="Credits"
                value={newCredits}
                onChange={(e) => setNewCredits(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                {Object.keys(currentScale).map((g) => (
                  <option key={g} value={g}>
                    {g} ({currentScale[g].toFixed(1)})
                  </option>
                ))}
              </select>
              <button
                onClick={addCourse}
                className="p-2 bg-rose-900 text-white rounded-lg hover:bg-rose-950 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Course Name</th>
                <th className="py-2.5 px-3 text-center">Credit Hours</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3 text-center">Quality Pts</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => {
                const pts = (currentScale[course.grade] ?? 0) * course.credits;
                return (
                  <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{course.code}</td>
                    <td className="py-3 px-3 text-slate-700">{course.name}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">
                      {course.credits}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-slate-100 text-rose-900">
                        {course.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {pts.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => removeCourse(course.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
