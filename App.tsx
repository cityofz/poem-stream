import React, { useState, useEffect } from 'react';
import { ViewState, Poem } from './types';
import { RecordView } from './RecordView';
import { FeedView } from './FeedView';
import { ProfileView } from './ProfileView';
import { PoemDetailView } from './PoemDetailView';
import { AuthView } from './AuthView';
import { SettingsView } from './SettingsView';
import { NotificationsView } from './NotificationsView';
import { ReloadPrompt } from './ReloadPrompt';
import { NAV_ITEMS } from './constants';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from './mockBackend';
import { WifiOff, RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('FEED');
  const [previousView, setPreviousView] = useState<ViewState>('FEED');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [replyingTo, setReplyingTo] = useState<Poem | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  useEffect(() => {
      if (!user) return;
      const checkNotifs = async () => { const notifs = await api.getNotifications(); setUnreadCount(notifs.filter(n => !n.read).length); };
      checkNotifs(); const interval = setInterval(checkNotifs, 30000); return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); handleSync(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const handleSync = async () => { setIsSyncing(true); await api.sync(); setIsSyncing(false); };
  const navigateTo = (view: ViewState) => {
    if (view === currentView) return;
    setPreviousView(currentView); setCurrentView(view);
    if (view !== 'POEM_DETAILS') setSelectedPoem(null);
    if (view !== 'RECORD') setReplyingTo(null);
    if (view !== 'PROFILE') setViewingProfileId(null);
    if (view === 'NOTIFICATIONS') setUnreadCount(0);
  };
  const handlePoemSelect = async (poemOrId: Poem | string) => {
      let poem: Poem | undefined;
      if (typeof poemOrId === 'string') poem = await api.getPoem(poemOrId); else poem = poemOrId;
      if (poem) { setPreviousView(currentView); setSelectedPoem(poem); setCurrentView('POEM_DETAILS'); }
  };
  const handleReply = (parentPoem: Poem) => { setReplyingTo(parentPoem); setPreviousView(currentView); setCurrentView('RECORD'); };
  const handleUserProfileClick = (userId: string) => { setPreviousView(currentView); setViewingProfileId(userId); setCurrentView('PROFILE'); };
  const handleBackFromDetail = () => { const target = (previousView === 'POEM_DETAILS' || previousView === 'RECORD') ? 'FEED' : previousView; setCurrentView(target); };
  const handleSavePoem = () => { if (replyingTo && selectedPoem && selectedPoem.id === replyingTo.id) setCurrentView('POEM_DETAILS'); else setCurrentView('FEED'); setReplyingTo(null); };

  if (isLoading) return <div className="h-full w-full bg-black flex items-center justify-center text-white font-mono">Loading...</div>;
  if (!user) return <AuthView />;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden relative">
        <ReloadPrompt />
        {isOffline && <div className="bg-red-900/80 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 flex items-center justify-center gap-2"><WifiOff size={12} /> Offline Mode</div>}
        {!isOffline && isSyncing && <div className="absolute top-0 right-0 p-2 z-[100]"><RefreshCw size={14} className="animate-spin text-zinc-500" /></div>}
        <div className="flex-1 overflow-hidden relative">
            {currentView === 'FEED' && <FeedView onViewPoemDetails={handlePoemSelect} onUserProfileClick={handleUserProfileClick} />}
            {currentView === 'RECORD' && <RecordView onSave={handleSavePoem} onCancel={() => setCurrentView(previousView)} replyingTo={replyingTo} />}
            {currentView === 'PROFILE' && <ProfileView userId={viewingProfileId || undefined} onViewPoemDetails={handlePoemSelect} onBack={viewingProfileId ? () => navigateTo('FEED') : undefined} onOpenSettings={() => { setPreviousView('PROFILE'); setCurrentView('SETTINGS'); }} />}
            {currentView === 'POEM_DETAILS' && selectedPoem && <PoemDetailView initialPoem={selectedPoem} onBack={handleBackFromDetail} onReply={handleReply} onSelectPoem={handlePoemSelect} />}
            {currentView === 'SETTINGS' && <SettingsView onBack={() => setCurrentView('PROFILE')} />}
            {currentView === 'NOTIFICATIONS' && <NotificationsView onViewPoem={handlePoemSelect} onViewProfile={handleUserProfileClick} />}
        </div>
        {currentView !== 'RECORD' && currentView !== 'POEM_DETAILS' && currentView !== 'SETTINGS' && (
            <div className="h-16 border-t border-zinc-900 bg-black flex items-center justify-around z-50">
                {NAV_ITEMS.map(item => {
                    const isActive = currentView === item.view && !viewingProfileId; const Icon = item.icon;
                    return (
                        <button key={item.label} onClick={() => navigateTo(item.view as ViewState)} className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} /><span className="text-[9px] uppercase tracking-widest font-medium">{item.label}</span>
                            {item.view === 'NOTIFICATIONS' && unreadCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse"></span>}
                        </button>
                    )
                })}
            </div>
        )}
    </div>
  );
};
const App: React.FC = () => { return <AuthProvider><AppContent /></AuthProvider>; };
export default App;
