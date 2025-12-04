
import React, { useState, useRef, useEffect } from 'react';
import { PROMPTS } from '../constants';
import { Keystroke, Poem } from '../types';
import { Button } from '../components/Button';
import { RefreshCw, Square, Trash2, CornerDownRight, PenTool, Save, AlertTriangle, Eye, EyeOff, Ban } from 'lucide-react';
import { api } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { playTypewriterClick, resumeAudioContext } from '../utils/audio';

interface RecordViewProps {
  onSave: () => void;
  onCancel: () => void;
  replyingTo?: Poem | null;
}

export const RecordView: React.FC<RecordViewProps> = ({ onSave, onCancel, replyingTo }) => {
  const { user, refreshUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isPromptVisible, setIsPromptVisible] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  
  // Confirmation State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'DISCARD' | 'RETRY' | null>(null);
  
  const textRef = useRef<string>('');
  const keystrokesRef = useRef<Keystroke[]>([]); 
  const lastKeystrokeTimeRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isFinishedRef = useRef(false);

  // Sync state to ref
  useEffect(() => {
      keystrokesRef.current = keystrokes;
  }, [keystrokes]);

  // Load User Preferences
  useEffect(() => {
      if (user?.preferences?.hidePrompts !== undefined) {
          setIsPromptVisible(!user.preferences.hidePrompts);
      }
  }, [user]);

  // Load Draft on Mount
  useEffect(() => {
    const draft = api.getDraft();
    if (draft) {
        setPrompt(draft.prompt);
        setText(draft.text);
        textRef.current = draft.text;
        setKeystrokes(draft.keystrokes);
        keystrokesRef.current = draft.keystrokes;
        if (draft.text.length > 0) setIsRecording(true);
    } else if (replyingTo) {
        setPrompt(`Response to ${replyingTo.authorName}`);
    } else {
        generatePrompt();
    }
  }, [replyingTo]);

  // Save draft on unmount
  useEffect(() => {
      return () => {
          if (!isFinishedRef.current && textRef.current.length > 0) {
             api.saveDraft({
                text: textRef.current,
                keystrokes: keystrokesRef.current,
                prompt: prompt, 
                replyingTo: replyingTo ? { id: replyingTo.id, authorName: replyingTo.authorName } : null,
                timestamp: Date.now()
            });
          }
      };
  }, [prompt, replyingTo]);

  // Periodic Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
        if (textRef.current.length > 0 && isRecording && !isFinishedRef.current) {
            api.saveDraft({
                text: textRef.current,
                keystrokes: keystrokesRef.current,
                prompt,
                replyingTo: replyingTo ? { id: replyingTo.id, authorName: replyingTo.authorName } : null,
                timestamp: Date.now()
            });
            setShowDraftSaved(true);
            setTimeout(() => setShowDraftSaved(false), 2000);
        }
    }, 30000); 

    return () => clearInterval(interval);
  }, [isRecording, prompt, replyingTo]);

  const generatePrompt = () => {
    const random = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setPrompt(random);
  };

  const togglePrompt = async () => {
      const newVisibility = !isPromptVisible;
      setIsPromptVisible(newVisibility);
      if (user) {
         try {
             await api.updateProfile({ 
                 ...user, 
                 preferences: { ...user.preferences, hidePrompts: !newVisibility } 
             });
             refreshUser();
         } catch(e) {}
      }
  };

  const startRecording = () => {
    resumeAudioContext();
    setText('');
    textRef.current = '';
    setKeystrokes([]);
    setIsRecording(true);
    lastKeystrokeTimeRef.current = Date.now();
    // Focus immediately
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, 50);
  };

  const stopRecording = () => setIsRecording(false);

  const handleSave = async () => {
    if (!text.trim() || !user) return;
    setIsSaving(true);
    isFinishedRef.current = true; 

    const newPoem: Poem = {
      id: `poem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      prompt,
      keystrokes,
      createdAt: Date.now(),
      likes: 0,
      replyCount: 0,
      authorId: user.id,
      authorName: user.username,
      parentId: replyingTo?.id
    };
    try {
        await api.createPoem(newPoem);
        api.clearDraft(); 
        onSave();
    } catch (error) {
        console.error(error);
        isFinishedRef.current = false;
    } finally {
        setIsSaving(false);
    }
  };

  const handleActionRequest = (action: 'DISCARD' | 'RETRY') => {
    if (text.length === 0) {
        // Safe to proceed immediately if no text
        if (action === 'DISCARD') {
            isFinishedRef.current = true;
            api.clearDraft(); 
            onCancel();
        } else {
            startRecording();
        }
    } else {
        // Show warning
        setPendingAction(action);
        setShowConfirmModal(true);
    }
  };

  const confirmAction = () => {
      if (pendingAction === 'DISCARD') {
          isFinishedRef.current = true;
          api.clearDraft();
          onCancel();
      } else if (pendingAction === 'RETRY') {
          startRecording();
      }
      setShowConfirmModal(false);
      setPendingAction(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setShowPasteWarning(true);
    setTimeout(() => setShowPasteWarning(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isRecording) return;
    
    // Play Sound
    playTypewriterClick();

    const newValue = e.target.value;
    const currentText = textRef.current;
    
    const now = Date.now();
    const delay = now - lastKeystrokeTimeRef.current;
    let i = 0;
    while (i < currentText.length && i < newValue.length && currentText[i] === newValue[i]) i++;

    const deleteCount = currentText.length - i;
    const addText = newValue.slice(i);
    const newKeystroke: Keystroke = { deleteCount, addText, delay };

    setKeystrokes(prev => [...prev, newKeystroke]);
    setText(newValue);
    textRef.current = newValue;
    lastKeystrokeTimeRef.current = now;

    // Keep cursor in view for mobile
    requestAnimationFrame(() => {
        if(textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    });
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isRecording) {
          if (text.length === 0) startRecording();
          return;
      }
      if (!textareaRef.current) return;
      if (e.target !== containerRef.current && e.target !== textareaRef.current) return;

      const textarea = textareaRef.current;
      const lineHeight = 32; 
      const rect = textarea.getBoundingClientRect();
      const clickY = e.clientY - rect.top + textarea.scrollTop;
      const clickedLine = Math.floor(clickY / lineHeight);
      const currentLines = text.split('\n').length;
      
      if (clickedLine >= currentLines) {
          const linesToAdd = (clickedLine - currentLines) + 1;
          const newNewlines = '\n'.repeat(linesToAdd);
          const now = Date.now();
          const delay = now - lastKeystrokeTimeRef.current;
          
          const newKeystroke: Keystroke = { 
              deleteCount: 0, 
              addText: newNewlines, 
              delay: delay > 1000 ? 100 : delay 
          };
          
          playTypewriterClick();

          setKeystrokes(prev => [...prev, newKeystroke]);
          setText(prev => prev + newNewlines);
          textRef.current = textRef.current + newNewlines;
          lastKeystrokeTimeRef.current = now;
          
          setTimeout(() => {
              textarea.selectionStart = textarea.value.length;
              textarea.selectionEnd = textarea.value.length;
              textarea.focus();
              textarea.scrollTop = textarea.scrollHeight;
          }, 0);
      } else {
          textarea.focus();
      }
  };

  if (!user) return <div className="h-full flex items-center justify-center text-zinc-400">Loading...</div>

  const isPublishDisabled = !text.trim() || isSaving;

  return (
    <div className="flex flex-col h-dvh w-full bg-black text-white p-4 animate-in fade-in overflow-hidden relative">
      
      {/* Action Confirmation Modal */}
      {showConfirmModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-in fade-in">
            <div className="bg-black border border-zinc-700 p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-red-900/20 rounded-none shrink-0 border border-red-900/30">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg mb-1 tracking-tight">
                            {pendingAction === 'DISCARD' ? 'Discard Draft?' : 'Start Over?'}
                        </h3>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            {pendingAction === 'DISCARD' 
                                ? "You're about to leave without saving. Your poem will be lost forever." 
                                : "This will erase your current writing and start a blank page. This cannot be undone."}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button 
                        onClick={() => { setShowConfirmModal(false); setPendingAction(null); }} 
                        className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-800"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmAction} 
                        className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                    >
                        {pendingAction === 'DISCARD' ? 'Discard' : 'Erase & Retry'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Top Bar: Prompt (Edge to Edge) */}
      <div className="w-full flex justify-between items-start pt-6 pb-2 min-h-[60px] z-10 shrink-0">
        <div className="flex-1 pr-4">
            {replyingTo ? (
                <div className="flex flex-col">
                    <span className="text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1 flex items-center gap-2">
                         <CornerDownRight size={12} /> Replying To
                    </span>
                    <div className="text-zinc-300 text-sm italic border-l-2 border-zinc-700 pl-3 py-1">"{replyingTo.text.substring(0, 50)}..."</div>
                </div>
            ) : (
                <div className="flex items-start gap-4 group">
                    <div onClick={!isRecording ? generatePrompt : undefined} className={`flex-1 cursor-pointer transition-colors ${isRecording ? 'pointer-events-none opacity-50' : 'hover:opacity-80'}`}>
                        <p className="text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Prompt</p>
                        {isPromptVisible && (
                            <p className="text-lg md:text-xl text-zinc-100 font-medium leading-tight font-serif italic animate-in fade-in">
                                "{prompt}"
                            </p>
                        )}
                    </div>
                    {/* Toggle Prompt Visibility */}
                    <button 
                        onClick={togglePrompt}
                        className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors"
                        title={isPromptVisible ? "Hide Prompt" : "Show Prompt"}
                    >
                        {isPromptVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Writing Area - Fixed "Index Card" */}
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className="flex-1 relative flex flex-col py-4 overflow-hidden cursor-text"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder=""
          disabled={!isRecording || isSaving}
          className="w-full h-full bg-transparent text-xl md:text-2xl font-mono leading-relaxed resize-none focus:outline-none placeholder:text-zinc-700 text-zinc-100 whitespace-pre-wrap overflow-hidden selection:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          spellCheck={false}
        />
        
        {/* Status Indicators */}
        {isRecording && (
          <div className="absolute top-0 right-0 flex flex-col items-end gap-2 pointer-events-none">
            <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <span className="font-mono text-xs text-red-500 tracking-[0.2em] font-bold">REC</span>
            </div>
          </div>
        )}

        {/* Draft Saved Toast */}
        <div className={`absolute top-8 right-0 transition-opacity duration-500 pointer-events-none ${showDraftSaved ? 'opacity-100' : 'opacity-0'}`}>
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-widest font-medium bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <Save size={10} /> Draft saved
            </span>
        </div>

        {/* Paste Warning Toast */}
        <div className={`absolute top-16 right-0 transition-opacity duration-500 pointer-events-none z-50 ${showPasteWarning ? 'opacity-100' : 'opacity-0'}`}>
            <span className="flex items-center gap-1.5 text-[10px] text-red-400 uppercase tracking-widest font-medium bg-red-900/20 px-3 py-2 rounded border border-red-900/50 backdrop-blur-md">
                <Ban size={10} /> No Pasting Allowed
            </span>
        </div>

        {!isRecording && text.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm uppercase tracking-[0.3em] font-light text-zinc-600 animate-pulse">Tap to start writing</p>
             </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-20 w-full flex items-center justify-between relative pb-safe shrink-0">
        {!isRecording && text.length === 0 ? (
          <div className="w-full flex justify-center">
            <button 
                onClick={startRecording} 
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black transition-all duration-200 bg-white font-mono rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:bg-zinc-200 active:scale-95"
            >
                <PenTool size={20} className="mr-3" />
                Write a Poem
            </button>
          </div>
        ) : (
          <>
            {isRecording ? (
              <div className="w-full flex justify-center">
                  <Button onClick={stopRecording} className="rounded-full w-20 h-20 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 flex items-center justify-center animate-pulse">
                    <Square size={28} fill="currentColor" />
                  </Button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-4 animate-in slide-up px-2">
                 <button 
                    onClick={() => handleActionRequest('DISCARD')} 
                    disabled={isSaving} 
                    className="text-zinc-500 hover:text-red-400 transition-colors p-4 flex flex-col items-center gap-1 disabled:opacity-50"
                 >
                    <Trash2 size={24} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Discard</span>
                </button>
                
                <Button 
                    onClick={handleSave} 
                    isLoading={isSaving} 
                    disabled={isPublishDisabled}
                    className={`flex-1 max-w-[200px] rounded-full px-8 py-4 font-bold tracking-widest uppercase text-sm transition-all duration-300
                        ${isPublishDisabled 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                            : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                        }`}
                >
                    Publish
                </Button>

                 <button 
                    onClick={() => handleActionRequest('RETRY')} 
                    disabled={isSaving} 
                    className="text-zinc-500 hover:text-white transition-colors p-4 flex flex-col items-center gap-1 disabled:opacity-50"
                 >
                    <RefreshCw size={24} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Retry</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
