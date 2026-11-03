"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onUploadClick: () => void;
  onGenerateGuideClick: () => void;
  isProcessing: boolean;
  isActionDisabled: boolean;
}

export default function Header({ 
  onUploadClick, 
  onGenerateGuideClick,
  isProcessing, 
  isActionDisabled 
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm z-10">
      
      {/* Title & Brand Clickable back to Landing */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
          <span>⚡</span>
        </div>
        <div>
          <h1 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">Spatial Knowledge Engine</h1>
          <p className="text-[10px] text-slate-500 font-medium">Muse Spark AI Study Environment</p>
        </div>
      </div>
      
      {/* Workspace Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
        <button 
          onClick={onUploadClick}
          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>📁</span> Upload PDF
        </button>

        {/* Feature 2: Smart Study Guide Button */}
        <button 
          onClick={onGenerateGuideClick}
          disabled={isActionDisabled}
          className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isProcessing ? <span className="animate-spin">⏳</span> : <span>📚</span>}
          <span>{isProcessing ? "Generating..." : "Generate Study Guide"}</span>
        </button>
      </div>
    </header>
  );
}