
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, UserPlus } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestSignup, setSuggestSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError('');
    setSuggestSignup(false);
    
    try {
        if (mode === 'signin') {
            await signIn(name.trim());
        } else {
            await signUp(name.trim());
        }
    } catch (err: any) {
        const msg = err.message || 'Authentication failed';
        setError(msg);
        if (mode === 'signin' && (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid'))) {
            setSuggestSignup(true);
        }
    } finally {
        setLoading(false);
    }
  };

  const switchToSignupAndSubmit = async () => {
      setMode('signup');
      setLoading(true);
      setError('');
      setSuggestSignup(false);
      try {
          await signUp(name.trim());
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
        <div className="max-w-md w-full space-y-12">
            
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold tracking-tighter text-white">
                    POEM STREAM
                </h1>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                    Typewriter Rhythm Recorder
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                    <label className="block text-center text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                        {mode === 'signin' ? 'Enter Pen Name' : 'Create Pen Name'}
                    </label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); setSuggestSignup(false); }}
                        autoFocus
                        className="w-full bg-transparent border-b border-zinc-800 text-center text-2xl py-2 text-white placeholder-zinc-800 focus:outline-none focus:border-white transition-colors font-mono"
                        placeholder="e.g. Eliot"
                    />
                </div>

                {error && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-red-500 text-xs text-center font-mono bg-red-900/10 p-2 rounded">
                            {error}
                        </div>
                        {suggestSignup && (
                            <button 
                                type="button"
                                onClick={switchToSignupAndSubmit}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs uppercase tracking-wider font-bold rounded-full transition-colors animate-in slide-up"
                            >
                                <UserPlus size={14} /> Create account for "{name}"?
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-center">
                    <button 
                        disabled={loading || !name.trim()}
                        className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : (
                            <>
                                {mode === 'signin' ? 'Enter' : 'Begin'} 
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Footer / Toggle */}
            <div className="text-center">
                <button 
                    onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setError('');
                        setSuggestSignup(false);
                    }}
                    className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                    {mode === 'signin' ? 'New here? Create Account' : 'Existing User? Sign In'}
                </button>
            </div>
        </div>
    </div>
  );
};
