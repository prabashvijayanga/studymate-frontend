"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import UploadModal from '../upload-modal';
import Header from '../layout/Header';
import ChatMessage from '../ChatMessage';

// Ensure the backend URL is formatted correctly for direct client-to-server API calls
const rawBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const BACKEND_BASE_URL = rawBaseUrl.replace(/\/$/, "");

// --- TYPES ---
interface PageNode {
  id: string;
  imageUrl: string;
  label: string;
  selected?: boolean;
  difficulty?: { level: string; score: number; reason: string; };
}

interface GraphNode {
  id: string;
  label: string;
  memorable_note: string;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export default function CanvasBoard() {
  // --- STATES ---
  const [pages, setPages] = useState<PageNode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Concept Web States
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Magic Wand States
  const [isMagicWandActive, setIsMagicWandActive] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // --- HANDLERS ---
  const handleUploadSuccess = (data: any) => {
    // Map backend data to frontend state with Render Base URL
    const newPages: PageNode[] = data.nodes_data.map((node: any) => ({
      id: node.id,
      imageUrl: `${BACKEND_BASE_URL}${node.imageUrl}`,
      label: node.label,
      selected: false,
      difficulty: node.difficulty
    }));
    setPages(newPages);
  };

  const selectedIndex = pages.findIndex(p => p.selected);
  const selectedPage = selectedIndex !== -1 ? pages[selectedIndex] : undefined;

  // Reset chat and wand tools when switching pages
  useEffect(() => {
    setChatMessages([]);
    setIsMagicWandActive(false);
    setIsSelecting(false);
  }, [selectedPage?.id]);

  // --- NAVIGATION HANDLERS ---
  const handlePrevPage = () => {
    if (selectedIndex > 0) {
      setPages(pgs => pgs.map((p, i) => ({ ...p, selected: i === selectedIndex - 1 })));
    }
  };

  const handleNextPage = () => {
    if (selectedIndex < pages.length - 1) {
      setPages(pgs => pgs.map((p, i) => ({ ...p, selected: i === selectedIndex + 1 })));
    }
  };

  // Handle direct Chat API requests
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedPage) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsChatting(true);
    
    try {
      const formData = new FormData();
      formData.append("image_url", selectedPage.imageUrl);
      formData.append("message", userMsg);
      
      const response = await fetch(`${BACKEND_BASE_URL}/api/chat`, { method: "POST", body: formData });
      const result = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: result.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI Tutor." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- MAGIC WAND LOGIC ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMagicWandActive || !selectedPage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectionCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = async () => {
    if (!isSelecting || !selectedPage || !imgRef.current) return;
    setIsSelecting(false);
    
    const { x: x1, y: y1 } = selectionStart;
    const { x: x2, y: y2 } = selectionCurrent;
    if (Math.abs(x2 - x1) < 10 || Math.abs(y2 - y1) < 10) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    
    const realX1 = Math.max(0, Math.min(Math.round(x1 * scaleX), img.naturalWidth - 1));
    const realY1 = Math.max(0, Math.min(Math.round(y1 * scaleY), img.naturalHeight - 1));
    const realX2 = Math.max(0, Math.min(Math.round(x2 * scaleX), img.naturalWidth - 1));
    const realY2 = Math.max(0, Math.min(Math.round(y2 * scaleY), img.naturalHeight - 1));

    setChatMessages(prev => [...prev, { role: 'user', text: `🪄 Selected custom area for extraction.` }]);
    setIsChatting(true);
    
    try {
      const formData = new FormData();
      formData.append("image_url", selectedPage.imageUrl);
      formData.append("x1", realX1.toString());
      formData.append("y1", realY1.toString());
      formData.append("x2", realX2.toString());
      formData.append("y2", realY2.toString());
      
      const response = await fetch(`${BACKEND_BASE_URL}/api/magic-wand`, { method: "POST", body: formData });
      const result = await response.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: result.reply }]);
      setIsMagicWandActive(false); 
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Failed to connect to backend server." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- KNOWLEDGE GRAPH LOGIC ---
  const handleGenerateConceptWeb = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      const pageIds = pages.map(p => p.id);
      const response = await fetch(`${BACKEND_BASE_URL}/api/knowledge-graph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_ids: pageIds })
      });
      const result = await response.json();
      setGraphNodes(result.nodes || []);
      setGraphEdges(result.edges || []);
      setIsGraphOpen(true);
    } catch (error) {
      alert("Failed to generate Concept Web.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isNodeConnected = (nodeId: string) => {
    if (!hoveredNodeId) return true;
    if (hoveredNodeId === nodeId) return true;
    return graphEdges.some(e => 
      (e.source === hoveredNodeId && e.target === nodeId) || 
      (e.target === hoveredNodeId && e.source === nodeId)
    );
  };

  // --- DOWNLOAD NOTES ---
  const handleDownloadNotes = () => {
    let content = "# 🕸️ MUSPARA AI - Concept Web & Smart Notes\n\n";
    
    graphNodes.forEach(node => {
      content += `## ${node.label}\n\n${node.memorable_note}\n\n`;
      
      const related = graphEdges.filter(e => e.source === node.id || e.target === node.id);
      if (related.length > 0) {
        content += `**Connections:**\n`;
        related.forEach(e => {
          const targetId = e.source === node.id ? e.target : e.source;
          const targetNode = graphNodes.find(n => n.id === targetId);
          content += `- *${e.relationship}* ➔ ${targetNode?.label}\n`;
        });
        content += `\n`;
      }
      content += `---\n\n`;
    });
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MUSPARA_Smart_Notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- RENDER ---
  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col relative overflow-hidden text-slate-100">
      
      {/* Top Header Component */}
      <Header 
        onUploadClick={() => setIsModalOpen(true)}
        onGenerateGuideClick={handleGenerateConceptWeb}
        isProcessing={isProcessing}
        isActionDisabled={isProcessing || pages.length === 0}
      />

      {/* Main Document Grid View Container */}
      <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900/50 custom-scrollbar p-4 md:p-8">
        {pages.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <span className="text-6xl mb-4">📄</span>
            <h2 className="text-2xl font-bold text-slate-300">No Document Uploaded</h2>
            <p className="text-xs text-slate-500 mt-2">Upload a PDF document to initialize spatial analysis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10 max-w-[1800px] mx-auto pb-20">
            {pages.map((page, index) => {
              const difficultyColor = 
                page.difficulty?.level === 'Hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                page.difficulty?.level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                
              const borderGlow = page.difficulty?.level === 'Hard' ? 'hover:border-rose-500 hover:shadow-rose-500/20' : 'hover:border-cyan-500 hover:shadow-cyan-500/20';

              return (
                <div key={page.id} onClick={() => setPages(pgs => pgs.map((p, i) => ({ ...p, selected: i === index })))} className={`group bg-slate-900 p-5 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-800 transition-all duration-300 cursor-pointer flex flex-col items-center relative ${borderGlow}`}>
                  
                  {/* Page Difficulty Badge */}
                  {page.difficulty && (
                    <div title={page.difficulty.reason} className={`absolute -top-4 right-4 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1 z-10 ${difficultyColor}`}>
                      {page.difficulty.level === 'Hard' ? '🔥 Hard' : page.difficulty.level === 'Medium' ? '⚡ Medium' : '🌱 Easy'}
                    </div>
                  )}
                  
                  <span className="text-sm text-slate-200 font-extrabold mb-4 mt-2 tracking-wide text-center">{page.label}</span>
                  
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={page.imageUrl} alt={page.label} className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Hover Overlay for Study Mode */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 px-6 py-3 rounded-full font-extrabold text-xs shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
                        <span>🔍</span> Open Study Mode
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- VISUAL CONCEPT WEB OVERLAY --- */}
      {isGraphOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 flex justify-between items-center border-b border-slate-800">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🕸️</span> Concept Web & Smart Notes
            </h2>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadNotes} 
                className="px-5 py-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded-xl font-bold transition-all flex items-center gap-2 border border-cyan-500/20 text-xs"
              >
                📥 Download Notes
              </button>
              <button 
                onClick={() => setIsGraphOpen(false)} 
                className="px-5 py-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl font-bold transition-all text-xs border border-rose-500/20"
              >
                Close Web ✖
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-10 custom-scrollbar relative flex flex-wrap gap-8 justify-center content-start">
            {graphNodes.length === 0 ? (
              <div className="text-cyan-400 text-center mt-20 text-xl animate-pulse font-medium">Extracting Knowledge Graph...</div>
            ) : (
              graphNodes.map((node) => {
                const connected = isNodeConnected(node.id);
                return (
                  <div 
                    key={node.id}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className={`w-[350px] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl transition-all duration-300 transform 
                      ${connected ? 'scale-100 opacity-100 border-cyan-500/50 shadow-cyan-500/10' : 'scale-95 opacity-30 blur-[2px]'}
                      ${hoveredNodeId === node.id ? 'scale-105 z-10 ring-2 ring-emerald-400 shadow-emerald-500/20' : 'z-0'}
                    `}
                  >
                    <div className="text-lg font-black text-white mb-3 border-b border-slate-800 pb-2">{node.label}</div>
                    
                    <div className="prose prose-sm prose-invert text-slate-300 prose-strong:text-cyan-400">
                      <ReactMarkdown>{node.memorable_note}</ReactMarkdown>
                    </div>

                    {hoveredNodeId === node.id && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-wider">Connects To:</div>
                        <div className="flex flex-wrap gap-2">
                          {graphEdges.filter(e => e.source === node.id || e.target === node.id).map((e, idx) => {
                            const relatedNodeId = e.source === node.id ? e.target : e.source;
                            const relatedNode = graphNodes.find(n => n.id === relatedNodeId);
                            return (
                              <span key={idx} className="bg-emerald-500/10 text-emerald-300 text-[10px] px-2 py-1 rounded-md font-semibold border border-emerald-500/20">
                                {e.relationship} ➔ {relatedNode?.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- STUDY MODE (MAGIC WAND & WIDE CHAT PANEL) --- */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-slate-950/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          
          {/* Left Side: PDF Page Viewer & Navigation */}
          <div className="flex-1 h-full relative flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center p-4 md:p-6 absolute top-0 w-full z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
              <button 
                onClick={() => setPages(pgs => pgs.map(p => ({ ...p, selected: false })))} 
                className="px-4 py-2 md:px-5 md:py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl font-medium flex items-center gap-2 backdrop-blur-md transition-all border border-slate-800 shadow-lg text-xs"
              >
                ← Back to Grid
              </button>

              <div className="flex items-center gap-2 md:gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-slate-200 shadow-lg">
                <button 
                  onClick={handlePrevPage} 
                  disabled={selectedIndex === 0}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all"
                >
                  ◀ Prev
                </button>
                <span className="text-xs font-bold px-2 text-cyan-400">
                  Page {selectedIndex + 1} of {pages.length}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={selectedIndex === pages.length - 1}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all"
                >
                  Next ▶
                </button>
              </div>
            </div>
            
            {/* Scrollable Image Canvas */}
            <div className="flex-1 overflow-auto flex justify-center items-start pt-24 pb-20 px-4 md:px-8 custom-scrollbar relative">
              <div 
                className="relative inline-block select-none shadow-2xl rounded-2xl border border-slate-800 bg-slate-900"
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              >
                <img 
                  ref={imgRef} src={selectedPage.imageUrl} alt={selectedPage.label} draggable={false}
                  className={`max-w-full lg:max-w-4xl h-auto rounded-2xl transition-all ${isMagicWandActive ? 'cursor-crosshair' : 'cursor-default'}`}
                />
                {isSelecting && (
                  <div className="absolute border-2 border-cyan-400 bg-cyan-500/20 pointer-events-none rounded-md"
                    style={{ left: Math.min(selectionStart.x, selectionCurrent.x), top: Math.min(selectionStart.y, selectionCurrent.y), width: Math.abs(selectionCurrent.x - selectionStart.x), height: Math.abs(selectionCurrent.y - selectionStart.y) }}
                  />
                )}
              </div>
              
              {/* Magic Wand Toggle Button */}
              <button onClick={() => setIsMagicWandActive(!isMagicWandActive)} className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold shadow-2xl transition-all flex items-center gap-2 z-20 text-xs ${isMagicWandActive ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 animate-pulse ring-4 ring-cyan-500/30' : 'bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800'}`}>
                <span className="text-lg">🪄</span> {isMagicWandActive ? "Drag a Box to Extract..." : "Enable Spatial Magic Wand"}
              </button>
            </div>
          </div>

          {/* Right Side: Fully Wide & Responsive AI Chat Panel */}
          <div className="w-full lg:w-[500px] xl:w-[600px] 2xl:w-[650px] h-[50vh] lg:h-full bg-slate-900 shadow-2xl flex flex-col rounded-t-3xl lg:rounded-t-none lg:rounded-l-3xl overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800 z-30">
            
            {/* Chat Header */}
            <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 font-bold text-slate-100 flex items-center gap-3 shadow-sm z-10">
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-xl text-cyan-400"><span className="text-xl">💬</span></div>
              <div>
                <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">AI Assistant</div>
                <div className="text-sm text-slate-200">MUSPARA AI Spatial Vision</div>
              </div>
            </div>
            
            {/* Messages Box */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col bg-slate-950/50">
              {chatMessages.length === 0 && (
                <div className="text-slate-400 text-sm text-center mt-6 md:mt-10 bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mx-auto w-full max-w-[95%]">
                  <span className="text-4xl block mb-3">👋</span>
                  <h3 className="font-bold text-white text-base mb-1">Interactive Study Mode</h3>
                  <div className="text-left bg-cyan-500/5 p-4 rounded-xl text-xs text-slate-300 border border-cyan-500/15 mt-4">
                    <ul className="space-y-2">
                      <li className="flex gap-2 text-cyan-300"><span>🪄</span> Click Magic Wand and <b>Drag</b> to extract diagrams</li>
                      <li className="flex gap-2 text-emerald-300"><span>✨</span> Ask questions about this specific page</li>
                    </ul>
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                {chatMessages.map((msg, idx) => (
                  <ChatMessage key={idx} role={msg.role} content={msg.text} />
                ))}
              </div>
              {isChatting && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium animate-pulse ml-2 mt-4">
                  <span>MUSPARA AI is processing...</span>
                </div>
              )}
            </div>
            
            {/* Chat Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 z-10 shadow-sm">
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                  placeholder="Ask a question about this page..." 
                  className="flex-1 px-4 py-3 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-950 text-xs text-slate-100 placeholder-slate-500" 
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={isChatting || !chatInput.trim()} 
                  className="px-6 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 rounded-xl hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 font-extrabold text-xs transition-all shadow-md"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}