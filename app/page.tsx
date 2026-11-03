"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Decorative background ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-xl">⚡</span>
          </div>
          <span className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
            Muse Spark
          </span>
        </div>
        
        <button 
          onClick={() => router.push('/canvas')}
          className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md shadow-lg"
        >
          Launch Workspace 🚀
        </button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center z-10 my-auto py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6 sm:mb-8 animate-pulse">
          <span>✨</span> Powered by Muse Spark AI & SAM 3.1 Vision
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-tight mb-6">
          Transform Any PDF Into An <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Interactive AI Study Hub
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 font-normal leading-relaxed">
          Upload your lecture notes, instantly extract key knowledge graphs, chat with complex diagrams using the Magic Wand, and master your exams at lightning speed.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
          <button 
            onClick={() => router.push('/canvas')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            Get Started Free ➔
          </button>
          <a 
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-sm sm:text-base border border-slate-800 transition-all"
          >
            Explore Features 📖
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 sm:mt-24 text-left">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-white text-base sm:text-lg mb-1">Lightning Fast</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Concurrent asynchronous processing extracts your whole document in seconds.</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="text-3xl mb-3">🪄</div>
            <h3 className="font-bold text-white text-base sm:text-lg mb-1">Magic Wand</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Crop and analyze complex diagrams and charts instantly using AI vision.</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="text-3xl mb-3">🕸️</div>
            <h3 className="font-bold text-white text-base sm:text-lg mb-1">Concept Web</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Generate interconnected knowledge webs and downloadable smart notes.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-slate-500 text-xs border-t border-slate-900/80 z-10">
        &copy; 2026 Muse Spark AI Study Workspace. Built with precision for top-tier academic performance.
      </footer>
    </main>
  );
}