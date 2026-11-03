import React from 'react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

export default function CodeModal({ isOpen, onClose, code }: CodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[700px] max-w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Generated Source Code</h2>
        
        {/* Code එක පෙන්නන අඳුරු පාට Box එක */}
        <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
          <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={() => navigator.clipboard.writeText(code)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Copy Code
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}