"use client"; 

import React, { useState } from 'react';
import { uploadPdfToBackend } from '../lib/api-client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (data: any) => void;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  // State to hold the selected file
  const [file, setFile] = useState<File | null>(null);
  // State to show loading status while uploading
  const [isUploading, setIsUploading] = useState(false);

  // If the modal is not open, do not render anything
  if (!isOpen) return null;

  // Function to handle when a user selects a file from their device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Function to handle the upload button click
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Send the file to our FastAPI backend directly from the browser
      const result = await uploadPdfToBackend(file);
      
      // Pass the backend response (image URLs & data) back to CanvasBoard
      onUploadSuccess(result);
      
      // Close the modal popup upon success
      onClose();
    } catch (error) {
      alert("Error uploading file. Please check if the backend is running and CORS is configured.");
    } finally {
      setIsUploading(false);
      setFile(null); // Reset the file input
    }
  };

  return (
    // Background overlay (dims the screen behind the modal)
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      
      {/* The actual modal box */}
      <div className="bg-white rounded-xl p-6 w-[400px] shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Upload Research Paper
        </h2>
        
        {/* File input field styled with Tailwind */}
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 mb-6
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 transition-colors"
        />
        
        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            disabled={isUploading}
          >
            Cancel
          </button>
          
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {isUploading ? "Processing PDF..." : "Upload & Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}