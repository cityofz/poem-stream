
import React, { useState, useEffect, useRef } from 'react';
import { Poem } from '../types';
import { Play, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playTypewriterClick } from '../utils/audio';

interface PoemPlayerProps {
  poem: Poem;
  isActive: boolean;
}

export const PoemPlayer: React.FC<PoemPlayerProps> = ({ poem, isActive }) => {
  const { user } = useAuth();
  const [displayText, setDisplayText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const currentIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Effect to handle Active state (Swipe functionality)
  useEffect(() => {
    if (!isActive) {
      pausePlayback();
    } else {
      // Small delay to allow scroll to settle
      const t = setTimeout(() => {
        startPlayback();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, []);

  const playNextKeystroke = () => {
    if (currentIndexRef.current >= poem.keystrokes.length) {
      setIsPlaying(false);
      setIsFinished(true);
      return;
    }

    const stroke = poem.keystrokes[currentIndexRef.current];
    const delay = Math.min(stroke.delay, 400); 

    timerRef.current = window.setTimeout(() => {
      // Play sound only if text is being added or deleted (skip idle pauses)
      if (stroke.addText || stroke.deleteCount > 0) {
          playTypewriterClick();
      }

      setDisplayText(prev => {
        const textAfterDelete = prev.slice(0, prev.length - stroke.deleteCount);
        return textAfterDelete + stroke.addText;
      });

      currentIndexRef.current += 1;
      playNextKeystroke();
    }, delay);
  };

  const startPlayback = () => {
    if (isFinished) {
      resetPlayback();
    } else {
      setIsPlaying(true);
      playNextKeystroke();
    }
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetPlayback = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayText('');
    currentIndexRef.current = 0;
    setIsFinished(false);
    setIsPlaying(true);
    setTimeout(playNextKeystroke, 50);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) pausePlayback();
    else startPlayback();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-6 md:p-8" onClick={togglePlay}>
      
      {/* Background prompt watermark - Extremely Subtle */}
      <div 
        className={`absolute top-12 left-0 w-full text-center pointer-events-none z-0 transition-all duration-1000 ease-out ${isActive ? 'opacity-20' : 'opacity-0'}`}
      >
        <p className="text-sm uppercase tracking-[0.3em] font-medium text-zinc-500">{poem.prompt}</p>
      </div>

      <div 
        className={`relative z-10 w-full max-w-xl mx-auto h-[60vh] flex items-center justify-center transition-all duration-700 ease-out ${isActive ? 'opacity-100 blur-0 scale-100' : 'opacity-10 blur-sm scale-95'}`}
      >
        {/* Fixed "Card" container with overflow hidden to match recording view */}
        <div className="w-full h-full overflow-hidden flex items-start justify-center pt-8">
            <p className="font-mono text-xl md:text-3xl leading-relaxed whitespace-pre-wrap text-zinc-100 break-words text-left w-full">
            {displayText}
            <span className={`inline-block w-2.5 h-6 md:h-8 bg-blue-500 align-middle ml-1 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-opacity duration-100 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></span>
            </p>
        </div>
        
        {/* Playback Controls Overlay (Visible when paused or finished) */}
        {!isPlaying && isActive && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
             <div className="bg-black/20 backdrop-blur-sm p-4 rounded-full border border-white/5 transition-all animate-zoom-in">
                {isFinished ? <RotateCcw size={24} className="text-white/50" /> : <Play size={24} className="ml-1 text-white/50" />}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
