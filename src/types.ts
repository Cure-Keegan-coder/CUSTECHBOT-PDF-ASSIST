export type ToolId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'sign'
  | 'edit'
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'watermark'
  | 'extract-images';

export type MainTab = 'pdf-tools' | 'gpa-calc' | 'study-companion';

export interface PdfToolDefinition {
  id: ToolId;
  title: string;
  badge?: 'POPULAR' | 'VISUAL' | 'FAST' | 'NEW';
  description: string;
  iconName: string;
}

export interface AcademicCourse {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: string;
}

