
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Poem } from '../types';
import { api } from '../services/mockBackend';
import { PoemPlayer } from '../components/PoemPlayer';
import { Heart, MessageCircle, Share2, Loader2, UserPlus, UserCheck, Check, MoreVertical, Flag, Ban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FeedViewProps {
    onViewPoemDetails: (poem: Poem) => void;
    onUserProfileClick: (userId: string) => void;
}

// Set to 10 to match Mock Backend limit. Real backend is 20, but logic works for both if this is lower/equal.
const PAGE_SIZE = 10;

export const FeedView: React.FC<FeedViewProps> = ({ onViewPoemDetails, onUserProfileClick }) => {
  const { user, refreshUser } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePoemId, setActivePoemId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [justSharedId, setJustSharedId] = useState<string | null>(null);
  
  // Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialFeed();
  }, []);

  const loadInitialFeed = async () => {
    try {
      const data = await api.getFeed();
      setPoems(data);
      if (data.length > 0) setActivePoemId(data[0].id);
      // If we got fewer items than a full page, we've reached the end
      if (data.length < PAGE_SIZE) setHasMore(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || poems.length === 0) return;
    setIsFetchingMore(true);
    try {
        const lastPoem = poems[poems.length - 1];
        const newPoems = await api.getFeed(lastPoem.createdAt);
        
        if (newPoems.length === 0) {
            setHasMore(false);
        } else {
            setPoems(prev => {
                // Deduplicate to be safe
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newPoems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            // Check against page size to determine if more exist
            if (newPoems.length < PAGE_SIZE) setHasMore(false);
        }
    } catch (e) { 
        console.error(e); 
    } finally { 
        setIsFetchingMore(false); 
    }
  }, [isFetchingMore, hasMore, poems]);

  const handleLike = async (poemId: string) => {
    const updated = await api.likePoem(poemId);
    if (updated) setPoems(prev => prev.map(p => p.id === poemId ? updated : p));
  };

  const handleToggleFollow = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    try {
        await api.toggleFollow(targetId);
        refreshUser();
    } catch (e) { console.error(e); }
  };

  const handleShare = async (poem: Poem) => {
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

  const handleReport = async (poemId: string) => {
      if (window.confirm("Report this poem for inappropriate content?")) {
          await api.reportPoem(poemId);
          // Remove locally
          setPoems(prev => prev.filter(p => p.id !== poemId));
          setOpenMenuId(null);
      }
  };

  const handleBlock = async (authorId: string) => {
      if (window.confirm("Block this user? You won't see their poems anymore.")) {
          await api.blockUser(authorId);
          // Remove all poems by this user locally
          setPoems(prev => prev.filter(p => p.authorId !== authorId));
          setOpenMenuId(null);
          refreshUser();
      }
  };

  // Trigger load more when approaching bottom
  useEffect(() => {
      if (!activePoemId || poems.length === 0) return;
      const index = poems.findIndex(p => p.id === activePoemId);
      // If we are within 3 items of the end, start loading
      if (index !== -1 && index >= poems.length - 3) {
          loadMore();
      }
  }, [activePoemId, loadMore, poems.length]);

  // Set up intersection observer for scroll snapping
  useEffect(() => {
    if (loading || poems.length === 0) return;
    
    const options = { 
        root: containerRef.current, 
        threshold: 0.6 
    };
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          if (id) setActivePoemId(id);
        }
      });
    }, options);

    // Observe all slides
    setTimeout(() => {
        const slides = document.querySelectorAll('.feed-slide');
        slides.forEach(slide => observerRef.current?.observe(slide));
    }, 100);

    return () => observerRef.current?.disconnect();
  }, [poems, loading]);

  if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-zinc-500" size={32} /></div>;

  return (
    <div 
        ref={containerRef}
        onClick={() => setOpenMenuId(null)} // Close menu on click anywhere
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-black focus:outline-none"
    >
      {poems.map((poem) => {
        const isFollowing = user?.following.includes(poem.authorId);
        const isActive = activePoemId === poem.id;
        const isMenuOpen = openMenuId === poem.id;

        return (
          <div 
            key={poem.id} 
            data-id={poem.id}
            className="feed-slide w-full h-full snap-start shrink-0 relative flex flex-col items-center justify-center bg-black overflow-hidden"
            style={{ scrollSnapStop: 'always' }}
          >
            {/* The Text Player - Fixed screen no scrolling visually */}
            <PoemPlayer poem={poem} isActive={isActive} />
            
            {/* Report / Block Menu */}
            <div className="absolute top-4 right-4 z-[60]">
                <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : poem.id); }}
                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                >
                    <MoreVertical size={20} />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded shadow-xl w-40 z-[70] animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleReport(poem.id); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                            <Flag size={14} /> Report Poem
                        </button>
                        {user?.id !== poem.authorId && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleBlock(poem.authorId); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs text-red-400 hover:bg-zinc-800 hover:text-red-300"
                            >
                                <Ban size={14} /> Block User
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Horizontal Bottom Bar - Adjusted for Nav Bar presence */}
            <div className={`absolute bottom-4 left-0 w-full px-4 flex items-end justify-between z-50 pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                 
                 {/* Left: Author Profile */}
                <div 
                    className="flex flex-col items-center relative mb-2 pointer-events-auto cursor-pointer"
                    onClick={() => onUserProfileClick(poem.authorId)}
                >
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

                {/* Right: Actions */}
                <div className="flex items-center gap-6 pointer-events-auto pb-2">
                    <button onClick={() => handleLike(poem.id)} className="flex flex-col items-center opacity-80 hover:opacity-100 group transition-all">
                        <Heart size={28} className={`transition-colors duration-300 ${poem.likes > 0 ? "fill-white text-white" : "text-white group-hover:text-red-500"}`} />
                        <span className="text-[10px] font-bold mt-1 text-white">{poem.likes}</span>
                    </button>

                    <button onClick={() => onViewPoemDetails(poem)} className="flex flex-col items-center opacity-80 hover:opacity-100 group transition-all">
                        <MessageCircle size={28} className="text-white group-hover:text-blue-400 transition-colors" />
                        <span className="text-[10px] font-bold mt-1 text-white">{poem.replyCount}</span>
                    </button>

                    <button onClick={() => handleShare(poem)} className="flex flex-col items-center opacity-80 hover:opacity-100 group transition-all">
                        {justSharedId === poem.id ? (
                            <Check size={28} className="text-green-500 animate-in zoom-in" />
                        ) : (
                            <Share2 size={28} className="text-white group-hover:text-green-400 transition-colors" />
                        )}
                        <span className={`text-[10px] font-bold mt-1 text-white transition-opacity ${justSharedId === poem.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {justSharedId === poem.id ? "Copied" : "Share"}
                        </span>
                    </button>
                </div>
            </div>
          </div>
        );
      })}

      {/* Loading Indicator / End of Stream */}
      <div className="w-full h-32 snap-start shrink-0 flex items-center justify-center bg-black text-zinc-400">
          {isFetchingMore ? (
             <div className="flex flex-col items-center gap-3 animate-pulse">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-300">Fetching poems...</span>
             </div>
          ) : !hasMore ? (
             <div className="flex flex-col items-center gap-2 opacity-50">
                <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-500">End of Stream</span>
             </div>
          ) : (
            <div className="h-full w-full"></div>
          )}
      </div>
    </div>
  );
};
