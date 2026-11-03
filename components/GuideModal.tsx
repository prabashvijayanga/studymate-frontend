import React from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideText: string;
}

export default function GuideModal({ isOpen, onClose, guideText }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">📚 Smart Study Guide</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
        </div>
        
        {/* Content Area - Renders the AI Markdown Text safely */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <pre className="text-gray-700 font-sans text-base leading-relaxed whitespace-pre-wrap">
            {guideText}
          </pre>
        </div>
        
        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={() => navigator.clipboard.writeText(guideText)}
            className="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Copy Text
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}