
import React, { useState, useEffect, useRef } from 'react';
import { Poem } from '../types';
import { ArrowLeft, MessageCircle, Heart, Share2, UserCheck, UserPlus, Check, CornerUpLeft, Loader2, MoreVertical, FileText, Flag, Download } from 'lucide-react';
import { api } from '../services/mockBackend';
import { PoemPlayer } from '../components/PoemPlayer';
import { useAuth } from '../context/AuthContext';

interface PoemDetailViewProps {
  initialPoem: Poem;
  onBack: () => void;
  onReply: (parentPoem: Poem) => void;
  onSelectPoem: (poem: Poem) => void;
}

export const PoemDetailView: React.FC<PoemDetailViewProps> = ({ initialPoem, onBack, onReply, onSelectPoem }) => {
  const { user, refreshUser } = useAuth();
  const [responses, setResponses] = useState<Poem[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [viewableId, setViewableId] = useState<string>(initialPoem.id);
  const [justSharedId, setJustSharedId] = useState<string | null>(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
        setLoadingResponses(true);
        try {
            const data = await api.getPoemResponses(initialPoem.id);
            setResponses(data);
        } catch (e) { console.error(e); } finally { setLoadingResponses(false); }
    };
    fetchResponses();
  }, [initialPoem]);

  useEffect(() => {
      const options = { root: containerRef.current, threshold: 0.6 };
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-id');
                if (id) setViewableId(id);
            }
        });
      }, options);
      setTimeout(() => {
         const slides = document.querySelectorAll('.detail-slide');
         slides.forEach(s => observerRef.current?.observe(s));
      }, 200);
      return () => observerRef.current?.disconnect();
  }, [responses]);

  const handleToggleFollow = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    try {
        await api.toggleFollow(targetId);
        refreshUser();
    } catch (e) { console.error(e); }
  };

  const handleReplyClick = (e: React.MouseEvent, poem: Poem) => {
    e.stopPropagation();
    onReply(poem);
  };

  const handleShare = async (e: React.MouseEvent, poem: Poem) => {
    e.stopPropagation(); // prevent play toggle
    const url = `${window.location.origin}?poemId=${poem.id}`;
    const shareData = {
        title: `Poem by @${poem.authorName}`,
        text: `Read this poem on Poem Stream:\n\n"${poem.text.substring(0, 50)}..."\n\n`,
        url: url
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {}
    } else {
        try {
            await navigator.clipboard.writeText(url);
            setJustSharedId(poem.id);
            setTimeout(() => setJustSharedId(null), 2000);
        } catch (err) {}
    }
  };

  const handleExportText = (e: React.MouseEvent, poem: Poem) => {
      e.stopPropagation();
      const date = new Date(poem.createdAt).toLocaleDateString();
      const content = `${poem.prompt.toUpperCase()}\n\n${poem.text}\n\n---\nWritten by @${poem.authorName}\n${date}\nGenerated via Poem Stream`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poem_${poem.authorName}_${poem.id.slice(-4)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMenuOpenId(null);
  };

  const handleReport = async (e: React.MouseEvent, poemId: string) => {
      e.stopPropagation();
      if (window.confirm("Report this poem for inappropriate content?")) {
          await api.reportPoem(poemId);
          alert("Poem reported. Thank you for keeping the community safe.");
          setMenuOpenId(null);
      }
  };

  const handleViewParent = async (e: React.MouseEvent, parentId: string) => {
      e.stopPropagation();
      setLoadingParent(true);
      try {
          const parent = await api.getPoem(parentId);
          if (parent) {
              onSelectPoem(parent);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingParent(false);
      }
  };

  const allPoems = [initialPoem, ...responses];

  return (
    <div 
        className="h-full w-full bg-black relative"
        onClick={() => setMenuOpenId(null)}
    >
       {/* Top Back Button */}
       <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-50 p-2 rounded-full bg-black/50 backdrop-blur-md text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
       </button>

       {/* Loading Overlay for Parent Fetch */}
       {loadingParent && (
           <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
               <Loader2 className="animate-spin text-white" size={32} />
           </div>
       )}

       <div 
         ref={containerRef}
         className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
       >
         {allPoems.map((poem, index) => {
             const isActive = viewableId === poem.id;
             const isFollowing = user?.following.includes(poem.authorId);
             const isResponse = index > 0;
             const isReply = !!poem.parentId;
             const isMenuOpen = menuOpenId === poem.id;
             
             return (
                 <div 
                    key={poem.id} 
                    data-id={poem.id}
                    className={`detail-slide w-full h-full snap-start shrink-0 relative flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${isResponse ? 'bg-zinc-950' : 'bg-black'}`}
                    style={{ scrollSnapStop: 'always' }}
                 >
                    {/* Visual Indicator for Responses */}
                    {index === 1 && responses.length > 0 && (
                        <div className="absolute top-20 w-full text-center z-10 opacity-50 pointer-events-none">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 animate-slide-up">Responses Below</p>
                        </div>
                    )}

                    {/* Navigation to Parent Poem */}
                    {isReply && (
                        <div 
                            onClick={(e) => handleViewParent(e, poem.parentId!)}
                            className="absolute top-24 md:top-20 z-40 cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800 transition-all">
                                <CornerUpLeft size={12} className="text-zinc-500 group-hover:text-zinc-300" />
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 font-bold">
                                    Replying to Poem
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Top Right Menu (Export/Report) */}
                    <div className="absolute top-6 right-6 z-[60]">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : poem.id); }}
                            className="p-2 rounded-full bg-black/20 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors backdrop-blur-sm"
                        >
                            <MoreVertical size={24} />
                        </button>
                        
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-48 z-[70] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                <button 
                                    onClick={(e) => handleExportText(e, poem)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                >
                                    <Download size={14} /> Export Text File
                                </button>
                                <button 
                                    onClick={(e) => handleReport(e, poem.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors border-t border-zinc-800/50"
                                >
                                    <Flag size={14} /> Report Poem
                                </button>
                            </div>
                        )}
                    </div>

                    <PoemPlayer poem={poem} isActive={isActive} />

                    {/* Edge to Edge Buttons */}
                    <div className={`absolute bottom-20 md:bottom-12 left-0 w-full px-4 flex items-end justify-between z-50 pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                        {/* Author */}
                        <div className="flex flex-col items-center relative mb-2 pointer-events-auto">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden mb-1">
                                {poem.authorAvatarUrl ? (
                                    <img src={poem.authorAvatarUrl} alt={poem.authorName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-zinc-300 text-xs font-bold">{poem.authorName ? poem.authorName.substring(0,2).toUpperCase() : '?'}</span>
                                )}
                            </div>
                            {user?.id !== poem.authorId && (
                                <button onClick={(e) => handleToggleFollow(e, poem.authorId)} className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 hover:scale-110 transition-transform shadow-lg">
                                    {isFollowing ? <UserCheck size={10} className="text-black" /> : <UserPlus size={10} className="text-black" />}
                                </button>
                            )}
                            <span className="text-[10px] text-zinc-200 font-medium tracking-wide">@{poem.authorName}</span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-6 pointer-events-auto pb-2">
                             <button className="flex flex-col items-center opacity-80 hover:opacity-100 group transition-all">
                                <Heart size={28} className={`transition-colors duration-300 ${poem.likes > 0 ? "fill-white text-white" : "text-white group-hover:text-red-500"}`} />
                                <span className="text-[10px] font-bold mt-1 text-white">{poem.likes}</span>
                            </button>

                            <button onClick={(e) => handleReplyClick(e, poem)} className="flex flex-col items-center opacity-80 hover:opacity-100 group transition-all">
                                <MessageCircle size={28} className="text-white group-hover:text-blue-400 transition-colors" />
                                <span className="text-[10px] font-bold mt-1 text-white">{poem.replyCount}</span>
                            </button>

                             <button onClick={(e) => handleShare(e, poem)} className="flex flex-col items-center opacity-80 hover:opacity-100 group transition-all">
                                {justSharedId === poem.id ? (
                                    <Check size={28} className="text-green-500 animate-in zoom-in" />
                                ) : (
                                    <Share2 size={28} className="text-white group-hover:text-green-400 transition-colors" />
                                )}
                                <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 text-white transition-opacity">
                                    {justSharedId === poem.id ? "Copied" : "Share"}
                                </span>
                            </button>
                        </div>
                    </div>
                 </div>
             )
         })}
       </div>
    </div>
  );
};
