import React, { useState, useEffect, useRef } from 'react';
import { Poem, Keystroke } from '../types';
import { ArrowLeft, Play, Pause, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '../components/Button';

interface PlaybackViewProps {
  poem: Poem;
  onBack: () => void;
}

export const PlaybackView: React.FC<PlaybackViewProps> = ({ poem, onBack }) => {
  const [displayText, setDisplayText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  // We use a local progress state for smooth slider movement
  const [sliderValue, setSliderValue] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  
  const currentIndexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start
  useEffect(() => {
    startPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync slider with ref during auto-playback
  useEffect(() => {
    setSliderValue(currentIndexRef.current);
  }, [displayText]); 

  // Helper: Reconstruct text from index 0 to targetIndex
  const reconstructTextAtIndex = (targetIndex: number): string => {
    let text = "";
    // Ensure we don't go out of bounds
    const limit = Math.min(targetIndex, poem.keystrokes.length);
    
    for (let i = 0; i < limit; i++) {
        const stroke = poem.keystrokes[i];
        const textAfterDelete = text.slice(0, text.length - stroke.deleteCount);
        text = textAfterDelete + stroke.addText;
    }
    return text;
  };

  const playNextKeystroke = () => {
    if (currentIndexRef.current >= poem.keystrokes.length) {
      setIsPlaying(false);
      setIsFinished(true);
      return;
    }

    const stroke = poem.keystrokes[currentIndexRef.current];
    
    // Safety check for delay
    const delay = stroke.delay < 0 ? 0 : stroke.delay;
    const adjustedDelay = delay > 2000 ? 2000 : delay;

    timerRef.current = window.setTimeout(() => {
      setDisplayText(prev => {
        const textAfterDelete = prev.slice(0, prev.length - stroke.deleteCount);
        return textAfterDelete + stroke.addText;
      });

      currentIndexRef.current += 1;
      
      // Recursive call
      playNextKeystroke();
    }, adjustedDelay);
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

  const stopPlayback = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const resetPlayback = () => {
    stopPlayback();
    setDisplayText('');
    currentIndexRef.current = 0;
    setSliderValue(0);
    setIsFinished(false);
    setIsPlaying(true);
    setTimeout(playNextKeystroke, 300);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    
    // Pause while dragging
    pausePlayback();
    
    // Update internal refs
    currentIndexRef.current = newIndex;
    setSliderValue(newIndex);
    
    // Update UI immediately
    const newText = reconstructTextAtIndex(newIndex);
    setDisplayText(newText);
    
    // Update finished state based on position
    if (newIndex >= poem.keystrokes.length) {
        setIsFinished(true);
    } else {
        setIsFinished(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
            Playback Mode
        </div>
        <button 
          className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          onClick={() => alert("Sharing not implemented in MVP")}
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center"
      >
        <div className="w-full max-w-2xl min-h-[50vh]">
            <div className="mb-8 text-zinc-500 italic text-sm border-l-2 border-zinc-800 pl-4 py-1">
                {poem.prompt}
            </div>
            
            <div className="text-xl md:text-2xl font-mono leading-relaxed text-zinc-100 whitespace-pre-wrap break-words relative">
                {displayText}
                {/* Blinking Cursor */}
                <span className={`inline-block w-2.5 h-6 bg-blue-500 align-middle ml-0.5 ${isPlaying && !isFinished ? 'cursor-blink' : 'opacity-0'}`}></span>
            </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-6 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800">
        <div className="max-w-2xl mx-auto">
            {/* Scrubber Slider */}
            <div className="w-full mb-6 relative group">
                <input 
                    type="range"
                    min="0"
                    max={poem.keystrokes.length}
                    value={sliderValue}
                    onChange={handleSeek}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
            </div>

            <div className="flex items-center justify-center gap-6">
                <Button 
                    variant="ghost" 
                    onClick={resetPlayback}
                    className="rounded-full w-12 h-12 p-0"
                    title="Replay"
                >
                    <RotateCcw size={20} />
                </Button>

                <button 
                    onClick={isPlaying ? pausePlayback : startPlayback}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                >
                    {isFinished ? (
                        <RotateCcw size={28} className="ml-[-2px]" />
                    ) : isPlaying ? (
                        <Pause size={28} />
                    ) : (
                        <Play size={28} className="ml-1" />
                    )}
                </button>
                
                {/* Placeholder for symmetry */}
                <div className="w-12"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
