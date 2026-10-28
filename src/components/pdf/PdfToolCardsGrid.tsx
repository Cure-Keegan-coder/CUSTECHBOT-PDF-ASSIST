import React from 'react';
import {
  GitMerge,
  Scissors,
  Minimize2,
  PenTool,
  Pencil,
  RefreshCw,
  ImageUp,
  Droplet,
  Crop,
} from 'lucide-react';
import { ToolId, PdfToolDefinition } from '../../types';

interface PdfToolCardsGridProps {
  onSelectTool: (toolId: ToolId) => void;
}

const PDF_TOOLS_LIST: PdfToolDefinition[] = [
  {
    id: 'merge',
    title: 'Merge PDF',
    badge: 'POPULAR',
    description: 'Combine multiple PDFs and reorder/rotate pages.',
    iconName: 'merge',
  },
  {
    id: 'split',
    title: 'Split PDF',
    badge: 'VISUAL',
    description: 'Extract pages or split into separate documents.',
    iconName: 'split',
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    badge: 'FAST',
    description: 'Reduce PDF file size while preserving quality.',
    iconName: 'compress',
  },
  {
    id: 'sign',
    title: 'Sign PDF',
    badge: 'NEW',
    description: 'Electronically sign documents with draw or type.',
    iconName: 'sign',
  },
  {
    id: 'edit',
    title: 'Edit PDF',
    badge: 'NEW',
    description: 'Add annotations, dates, and text notes to pages.',
    iconName: 'edit',
  },
  {
    id: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages into high-res JPG or PNG images.',
    iconName: 'pdf-to-image',
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, and WebP images into a PDF.',
    iconName: 'image-to-pdf',
  },
  {
    id: 'watermark',
    title: 'Add Watermark',
    description: 'Stamp text watermarks with position and opacity.',
    iconName: 'watermark',
  },
  {
    id: 'extract-images',
    title: 'Extract Images',
    description: 'Extract embedded images from PDF documents.',
    iconName: 'extract-images',
  },
];

export const PdfToolCardsGrid: React.FC<PdfToolCardsGridProps> = ({ onSelectTool }) => {
  const renderIcon = (name: string) => {
    switch (name) {
      case 'merge':
        // Custom connected branching nodes icon matching screenshot
        return (
          <svg
            className="w-7 h-7 text-[#881337]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <circle cx="10" cy="18" r="2.5" />
            <path d="M6 8.5V14a4 4 0 0 0 4 4" />
            <path d="M12.5 18H15.5" />
          </svg>
        );
      case 'split':
        return <Scissors className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'compress':
        return <Minimize2 className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'sign':
        return <PenTool className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'edit':
        return <Pencil className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'pdf-to-image':
        return <RefreshCw className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'image-to-pdf':
        return <ImageUp className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'watermark':
        return <Droplet className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      case 'extract-images':
        return <Crop className="w-6 h-6 text-[#881337] stroke-[2.2]" />;
      default:
        return <GitMerge className="w-6 h-6 text-[#881337]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2">
      {/* 2-column grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PDF_TOOLS_LIST.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTool(tool.id);
              }
            }}
            className="group relative bg-white rounded-2xl border border-gray-100/90 hover:border-rose-200/90 p-7 text-center shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            {/* Top-right badge if present */}
            {tool.badge && (
              <div className="absolute top-5 right-5">
                <span className="inline-block bg-[#f4f5f7] text-[#4b5563] text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase">
                  {tool.badge}
                </span>
              </div>
            )}

            {/* Pink squircle icon container */}
            <div className="w-13 h-13 bg-[#fdf2f4] rounded-2xl flex items-center justify-center mx-auto mb-3.5 group-hover:scale-105 transition-transform duration-200">
              {renderIcon(tool.iconName)}
            </div>

            {/* Title */}
            <h3 className="text-slate-900 font-bold text-lg md:text-[19px] tracking-tight mb-1.5">
              {tool.title}
            </h3>

            {/* Subtitle / Description */}
            <p className="text-slate-500 text-[13.5px] leading-relaxed max-w-[320px] mx-auto">
              {tool.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
