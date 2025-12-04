
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/mockBackend';
import { ArrowLeft, LogOut, Eye, EyeOff, Shield, UserX, Unlock } from 'lucide-react';
import { User } from '../types';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { user, refreshUser, signOut } = useAuth();
  const [blockedProfiles, setBlockedProfiles] = useState<User[]>([]);
  const [loadingSafety, setLoadingSafety] = useState(false);

  // User preferences state
  const hidePrompts = user?.preferences?.hidePrompts || false;

  useEffect(() => {
    loadBlockedProfiles();
  }, [user]);

  const loadBlockedProfiles = async () => {
    if (!user?.blockedUsers || user.blockedUsers.length === 0) {
        setBlockedProfiles([]);
        return;
    }
    setLoadingSafety(true);
    try {
        const profiles = await Promise.all(
            user.blockedUsers.map(id => api.getUserProfile(id))
        );
        // Filter out nulls in case user deleted account
        setBlockedProfiles(profiles.filter(p => p !== null) as User[]);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingSafety(false);
    }
  };

  const togglePromptPreference = async () => {
    if (!user) return;
    try {
        await api.updateProfile({ 
            ...user, 
            preferences: { ...user.preferences, hidePrompts: !hidePrompts } 
        });
        refreshUser();
    } catch(e) {}
  };

  const handleUnblock = async (targetId: string) => {
      try {
          await api.unblockUser(targetId);
          await refreshUser();
          setBlockedProfiles(prev => prev.filter(p => p.id !== targetId));
      } catch (e) { console.error(e); }
  };

  return (
    <div className="h-full w-full bg-black text-white overflow-y-auto p-6 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <button 
                onClick={onBack}
                className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                aria-label="Go Back"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </div>

        <div className="max-w-md mx-auto space-y-12">
            
            {/* Preferences Section */}
            <section className="space-y-4">
                <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-900 pb-2">
                    Preferences
                </h2>
                <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded border border-zinc-900">
                    <div className="flex items-center gap-3">
                        {hidePrompts ? <EyeOff size={20} className="text-zinc-400" /> : <Eye size={20} className="text-zinc-400" />}
                        <div>
                            <p className="text-sm font-medium">Writing Prompts</p>
                            <p className="text-xs text-zinc-500">{hidePrompts ? 'Hidden by default' : 'Visible by default'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={togglePromptPreference}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${hidePrompts ? 'bg-zinc-700' : 'bg-blue-600'}`}
                        aria-label={hidePrompts ? "Enable prompts" : "Disable prompts"}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${hidePrompts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </section>

            {/* Safety Section */}
            <section className="space-y-4">
                <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <Shield size={12} /> Safety
                </h2>
                
                <div className="bg-zinc-900/30 rounded border border-zinc-900 overflow-hidden">
                    <div className="p-4 bg-zinc-900/50 border-b border-zinc-900">
                        <p className="text-sm font-medium">Blocked Users</p>
                    </div>
                    
                    {loadingSafety ? (
                        <div className="p-4 text-center text-xs text-zinc-600">Loading...</div>
                    ) : blockedProfiles.length === 0 ? (
                        <div className="p-6 text-center text-zinc-600 text-xs italic">
                            You haven't blocked anyone.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-900">
                            {blockedProfiles.map(profile => (
                                <div key={profile.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                            {profile.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserX size={14} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <span className="text-sm text-zinc-300">@{profile.username}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleUnblock(profile.id)}
                                        className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white flex items-center gap-1 px-3 py-1 rounded hover:bg-zinc-800 transition-colors"
                                        aria-label={`Unblock ${profile.username}`}
                                    >
                                        <Unlock size={12} /> Unblock
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Account Section */}
            <section className="space-y-4">
                <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-900 pb-2">
                    Account
                </h2>
                <button 
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 p-4 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded border border-zinc-900 hover:border-red-900/30 transition-all font-bold text-sm uppercase tracking-wider"
                    aria-label="Sign Out"
                >
                    <LogOut size={16} /> Sign Out
                </button>
                <div className="text-center">
                    <p className="text-[10px] text-zinc-700 font-mono">Poem Stream v1.0.0</p>
                </div>
            </section>

        </div>
    </div>
  );
};
