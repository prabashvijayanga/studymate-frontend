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
    // Map the backend data to our frontend state, appending the Render Base URL to the image paths
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

  // --- NAVIGATION HANDLERS FOR PREV / NEXT PAGES ---
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
      
      // Direct call to Render backend. Browser will wait regardless of Vercel timeouts.
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
    
    // Clamp values to prevent out-of-bounds API errors (SAM extraction bounds)
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
      
      // Request SAM 3.1 extraction directly from Render
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
      // Direct call to Render for heavy knowledge graph extraction. 
      // The browser handles this request, completely immune to the 10s Vercel limit.
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
    if (!hoveredNodeId) return true; // Show all normally if nothing hovered
    if (hoveredNodeId === nodeId) return true; // The hovered node itself
    // Check if it's connected via an edge
    return graphEdges.some(e => 
      (e.source === hoveredNodeId && e.target === nodeId) || 
      (e.target === hoveredNodeId && e.source === nodeId)
    );
  };

  // --- DOWNLOAD NOTES FEATURE ---
  const handleDownloadNotes = () => {
    let content = "# 🕸️ AI Concept Web & Smart Notes\n\n";
    
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
    a.download = "AI_Smart_Notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- RENDER ---
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      
      <Header 
        onUploadClick={() => setIsModalOpen(true)}
        onGenerateGuideClick={handleGenerateConceptWeb}
        isProcessing={isProcessing}
        isActionDisabled={isProcessing || pages.length === 0}
      />

      {/* Main Document Grid View */}
      <div className="flex-1 w-full h-full overflow-y-auto bg-gray-100/50 custom-scrollbar p-8">
        {pages.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-6xl mb-4">📄</span>
            <h2 className="text-2xl font-bold text-gray-600">No Document Uploaded</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 max-w-[1800px] mx-auto pb-20">
            {pages.map((page, index) => {
              const difficultyColor = 
                page.difficulty?.level === 'Hard' ? 'bg-red-50 text-red-700 border-red-300' :
                page.difficulty?.level === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                'bg-green-50 text-green-700 border-green-300';
                
              const borderGlow = page.difficulty?.level === 'Hard' ? 'hover:border-red-400 hover:shadow-red-200' : 'hover:border-blue-400 hover:shadow-blue-200';

              return (
                <div key={page.id} onClick={() => setPages(pgs => pgs.map((p, i) => ({ ...p, selected: i === index })))} className={`group bg-white p-5 rounded-3xl shadow-md hover:shadow-2xl border-2 border-transparent transition-all duration-300 cursor-pointer flex flex-col items-center animate-in fade-in zoom-in-95 relative ${borderGlow}`}>
                  
                  {/* Difficulty Badge */}
                  {page.difficulty && (
                    <div title={page.difficulty.reason} className={`absolute -top-4 right-4 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1 z-10 ${difficultyColor}`}>
                      {page.difficulty.level === 'Hard' ? '🔥 Hard' : page.difficulty.level === 'Medium' ? '⚡ Medium' : '🌱 Easy'}
                    </div>
                  )}
                  
                  <span className="text-lg text-gray-800 font-extrabold mb-4 mt-2 tracking-wide text-center">{page.label}</span>
                  
                  <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={page.imageUrl} alt={page.label} className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Hover popup message for Open Study Mode */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-full text-blue-700 font-bold text-sm shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
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
        <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🕸️</span> AI Concept Web & Smart Notes
            </h2>
            
            {/* Download Notes & Close Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadNotes} 
                className="px-5 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white rounded-full font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                📥 Download Notes
              </button>
              <button 
                onClick={() => setIsGraphOpen(false)} 
                className="px-5 py-2 bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white rounded-full font-bold transition-all"
              >
                Close Web ✖
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-10 custom-scrollbar relative flex flex-wrap gap-8 justify-center content-start">
            {graphNodes.length === 0 ? (
              <div className="text-white text-center mt-20 text-xl animate-pulse">Extracting Knowledge Graph...</div>
            ) : (
              graphNodes.map((node) => {
                const connected = isNodeConnected(node.id);
                return (
                  <div 
                    key={node.id}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className={`w-[350px] bg-white rounded-3xl p-6 shadow-2xl transition-all duration-300 transform 
                      ${connected ? 'scale-100 opacity-100 border-2 border-blue-400 shadow-blue-500/30' : 'scale-95 opacity-30 blur-[2px]'}
                      ${hoveredNodeId === node.id ? 'scale-105 z-10 ring-4 ring-purple-500 shadow-purple-500/50' : 'z-0'}
                    `}
                  >
                    <div className="text-xl font-black text-gray-800 mb-3 border-b-2 border-gray-100 pb-2">{node.label}</div>
                    
                    <div className="prose prose-sm text-gray-600 prose-strong:text-blue-700">
                      <ReactMarkdown>{node.memorable_note}</ReactMarkdown>
                    </div>

                    {hoveredNodeId === node.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs font-bold text-purple-600 mb-2 uppercase tracking-wide">Connects To:</div>
                        <div className="flex flex-wrap gap-2">
                          {graphEdges.filter(e => e.source === node.id || e.target === node.id).map((e, idx) => {
                            const relatedNodeId = e.source === node.id ? e.target : e.source;
                            const relatedNode = graphNodes.find(n => n.id === relatedNodeId);
                            return (
                              <span key={idx} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-semibold border border-purple-200">
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

      {/* --- FULL-SCREEN INTERACTIVE STUDY MODE (MAGIC WAND & PREV/NEXT NAVIGATION) --- */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 flex bg-gray-900/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex-1 h-full relative flex flex-col">
            
            {/* Top Bar with Back to Grid & Previous/Next Page Navigation */}
            <div className="flex justify-between items-center p-6 absolute top-0 w-full z-10 bg-gradient-to-b from-gray-900/80 to-transparent">
              <button 
                onClick={() => setPages(pgs => pgs.map(p => ({ ...p, selected: false })))} 
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium flex items-center gap-2 backdrop-blur-md transition-all border border-white/10 shadow-lg hover:scale-105"
              >
                ← Back to Grid
              </button>

              {/* Page Navigation Controls */}
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white">
                <button 
                  onClick={handlePrevPage} 
                  disabled={selectedIndex === 0}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold disabled:opacity-30 transition-all"
                >
                  ◀ Prev
                </button>
                <span className="text-xs font-bold px-2">
                  Page {selectedIndex + 1} of {pages.length}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={selectedIndex === pages.length - 1}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold disabled:opacity-30 transition-all"
                >
                  Next ▶
                </button>
              </div>
            </div>
            
            {/* PDF Page Viewer Area */}
            <div className="flex-1 overflow-auto flex justify-center items-start pt-24 pb-12 px-8 custom-scrollbar relative">
              <div 
                className="relative inline-block select-none shadow-[0_0_50px_rgba(0,0,0,0.4)] rounded-md border border-gray-700 bg-white"
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              >
                <img 
                  ref={imgRef} src={selectedPage.imageUrl} alt={selectedPage.label} draggable={false}
                  className={`max-w-4xl h-auto rounded-md transition-all ${isMagicWandActive ? 'cursor-crosshair' : 'cursor-default'}`}
                />
                {isSelecting && (
                  <div className="absolute border-2 border-purple-500 bg-purple-500/30 pointer-events-none"
                    style={{ left: Math.min(selectionStart.x, selectionCurrent.x), top: Math.min(selectionStart.y, selectionCurrent.y), width: Math.abs(selectionCurrent.x - selectionStart.x), height: Math.abs(selectionCurrent.y - selectionStart.y) }}
                  />
                )}
              </div>
              
              <button onClick={() => setIsMagicWandActive(!isMagicWandActive)} className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-2xl transition-all flex items-center gap-2 z-20 ${isMagicWandActive ? 'bg-purple-600 text-white animate-pulse ring-4 ring-purple-400/50' : 'bg-gray-800 text-white border border-gray-600 hover:bg-gray-700'}`}>
                <span className="text-xl">🪄</span> {isMagicWandActive ? "Drag a Box to Extract..." : "Enable Magic Wand"}
              </button>
            </div>
          </div>

          {/* Right Side Wide Chat Panel */}
          <div className="w-[500px] xl:w-[550px] h-full bg-white shadow-2xl flex flex-col rounded-l-3xl overflow-hidden border-l border-white/20 animate-in slide-in-from-right duration-500">
            <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white font-bold text-blue-800 flex items-center gap-3 shadow-sm z-10">
              <div className="bg-blue-100 p-2 rounded-lg"><span className="text-xl">💬</span></div>
              <div>
                <div className="text-xs text-blue-500 uppercase tracking-wider font-semibold">AI Assistant</div>
                <div className="text-base text-gray-800">Muse Spark & SAM 3.1</div>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-gray-50/50">
              {chatMessages.length === 0 && (
                <div className="text-gray-500 text-sm text-center mt-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mx-auto w-full max-w-[90%]">
                  <span className="text-4xl block mb-4">👋</span>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">Interactive Study Mode</h3>
                  <div className="text-left bg-blue-50/50 p-4 rounded-xl text-xs text-gray-600 border border-blue-100 mt-4">
                    <ul className="space-y-2">
                      <li className="flex gap-2"><span>🪄</span> Click Magic Wand and <b>Drag</b> to select</li>
                      <li className="flex gap-2"><span>✨</span> Type to ask anything about this page</li>
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
                <div className="flex items-center gap-2 text-blue-500 text-sm font-medium animate-pulse ml-2 mt-4">
                  <span className="ml-2">AI is processing...</span>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t bg-white z-10 shadow-sm">
              <div className="flex gap-2 relative">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask a question..." className="flex-1 px-5 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm" />
                <button onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()} className="px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}