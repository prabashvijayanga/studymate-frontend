import React from 'react';

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
  return (
    <header className="w-full h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
      <h1 className="text-xl font-bold text-gray-800">Spatial Knowledge Engine</h1>
      
      <div className="flex gap-4">
        <button 
          onClick={onUploadClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition shadow-sm"
        >
          Upload PDF
        </button>

        {/* Feature 2: Smart Cheat Sheet Button */}
        <button 
          onClick={onGenerateGuideClick}
          disabled={isActionDisabled}
          className="px-4 py-2 bg-gray-800 text-white rounded-md font-medium hover:bg-gray-900 transition shadow-sm disabled:opacity-50"
        >
          {isProcessing ? "Generating..." : "📚 Generate Study Guide"}
        </button>
      </div>
    </header>
  );
}