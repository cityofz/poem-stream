
import React, { useEffect, useState } from 'react';
import { Poem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/mockBackend';
import { Edit2, Heart, Loader2, Check, X, RefreshCw, Settings, Link, ArrowLeft } from 'lucide-react';

interface ProfileViewProps {
    userId?: string; // Optional: if provided, view that user. If not, view self.
    onViewPoemDetails: (poem: Poem) => void;
    onBack?: () => void;
    onOpenSettings?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onViewPoemDetails, onBack, onOpenSettings }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [targetUser, setTargetUser] = useState<any>(null); // Use 'any' temporarily or type strictly
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit states
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const isSelf = !userId || (currentUser && currentUser.id === userId);

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
        if (isSelf && currentUser) {
            setTargetUser(currentUser);
            const data = await api.getUserPoems(currentUser.id);
            setPoems(data);
        } else if (userId) {
            const userProfile = await api.getUserProfile(userId);
            if (userProfile) {
                setTargetUser(userProfile);
                const data = await api.getUserPoems(userId);
                setPoems(data);
            }
        }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const startEditing = () => {
    if (isSelf && currentUser) {
        setEditName(currentUser.username);
        setEditBio(currentUser.bio || '');
        setEditAvatar(currentUser.avatarUrl || '');
        setIsEditing(true);
    }
  };

  const saveProfile = async () => {
    if (!currentUser || !editName.trim()) return;
    try {
      await api.updateProfile({ ...currentUser, username: editName.trim(), bio: editBio.trim(), avatarUrl: editAvatar });
      await refreshUser();
      // Update local state immediately for responsiveness
      setTargetUser({ ...currentUser, username: editName.trim(), bio: editBio.trim(), avatarUrl: editAvatar });
      setIsEditing(false);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin" /></div>;
  if (!targetUser) return <div className="h-full flex items-center justify-center text-zinc-500">User not found</div>;

  return (
    <div className="h-full overflow-y-auto bg-black pb-24 no-scrollbar relative">
        <div className="absolute top-6 left-6 z-20 flex gap-4">
             {onBack && (
                <button 
                    onClick={onBack} 
                    className="text-zinc-400 hover:text-white transition-colors bg-black/50 p-2 rounded-full backdrop-blur-sm"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} />
                </button>
            )}
        </div>
       
        {isSelf && onOpenSettings && (
             <div className="absolute top-6 right-6 z-20">
                 <button 
                    onClick={onOpenSettings}
                    className="text-zinc-400 hover:text-white transition-colors bg-black/50 p-2 rounded-full backdrop-blur-sm"
                    aria-label="Open Settings"
                 >
                     <Settings size={24} />
                 </button>
             </div>
        )}

        {/* Header - Structured Layout */}
        <div className="p-6 pt-12 border-b border-zinc-900 bg-zinc-950/30">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
                {/* Avatar Section */}
                <div className="relative mb-6 group">
                    <div className="w-28 h-28 rounded-full bg-zinc-900 border-4 border-black ring-1 ring-zinc-800 overflow-hidden shadow-2xl">
                        {targetUser.avatarUrl ? (
                            <img src={isEditing ? editAvatar : targetUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-3xl">
                                 {targetUser.username?.substring(0, 2).toUpperCase()}
                             </div>
                        )}
                    </div>
                </div>

                {/* Info / Edit Section */}
                {isEditing ? (
                    <div className="w-full space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Username</label>
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-center text-white focus:outline-none focus:border-zinc-600" placeholder="Username" />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Bio</label>
                            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-center text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none" rows={3} placeholder="Write something about yourself..." />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Avatar Image</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Link size={12} className="text-zinc-500" />
                                    </div>
                                    <input 
                                        value={editAvatar} 
                                        onChange={e => setEditAvatar(e.target.value)} 
                                        className="w-full bg-black border border-zinc-800 rounded pl-8 pr-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600" 
                                        placeholder="Paste image URL..." 
                                    />
                                </div>
                                <button 
                                    onClick={() => setEditAvatar(`https://api.dicebear.com/7.x/notionists/svg?seed=${Date.now()}&backgroundColor=b6e3f4`)}
                                    className="px-3 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors flex items-center justify-center"
                                    title="Generate Random Avatar"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 pt-2">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm">
                                <X size={16} /> Cancel
                            </button>
                            <button onClick={saveProfile} className="px-6 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2 text-sm font-bold">
                                <Check size={16} /> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">@{targetUser.username}</h1>
                        <p className="text-zinc-300 text-sm max-w-xs mx-auto mb-6 leading-relaxed">{targetUser.bio || "No bio yet."}</p>
                        
                        {/* Stats Row */}
                        <div className="flex items-center gap-8 mb-6 bg-zinc-900/50 px-6 py-3 rounded-full border border-zinc-800/50">
                            <div className="text-center">
                                <span className="block text-white font-bold text-lg">{poems.length}</span>
                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Poems</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-800"></div>
                            <div className="text-center">
                                <span className="block text-white font-bold text-lg">{targetUser.followers?.length || 0}</span>
                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Followers</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-800"></div>
                            <div className="text-center">
                                <span className="block text-white font-bold text-lg">{targetUser.following?.length || 0}</span>
                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Following</span>
                            </div>
                        </div>

                        {isSelf && (
                            <button 
                                onClick={startEditing} 
                                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-full border border-transparent hover:border-zinc-800"
                            >
                                <Edit2 size={14} /> Edit Profile
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* Grid Title */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-900 py-3 px-6 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Collection</span>
        </div>

        {/* Poems Grid - High Contrast */}
        {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin text-zinc-500 mx-auto" /></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1">
                {poems.map(poem => (
                    <div 
                        key={poem.id} 
                        onClick={() => onViewPoemDetails(poem)} 
                        className="aspect-square bg-zinc-900 hover:bg-zinc-800 p-6 flex flex-col items-center justify-center relative group cursor-pointer transition-colors border border-transparent hover:border-zinc-700 rounded-sm"
                    >
                        {/* Thumbnail Text - High Contrast */}
                        <p className="text-[10px] md:text-xs text-zinc-300 line-clamp-6 text-center font-mono leading-relaxed opacity-90 group-hover:opacity-100">
                            {poem.text}
                        </p>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Heart size={16} className="fill-white" />
                                <span>{poem.likes}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {poems.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                        No poems written yet.
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
