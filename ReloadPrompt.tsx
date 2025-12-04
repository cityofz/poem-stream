
import React from 'react';
// import { useRegisterSW } from 'virtual:pwa-register/react'; // This import causes crashes in web previews. Uncomment for local prod build.
import { RefreshCw, X } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  // MOCK IMPLEMENTATION FOR PREVIEW STABILITY
  // In a real local environment, uncomment the import above and the code below.
  const offlineReady = false;
  const needRefresh = false;
  const updateServiceWorker = (reload: boolean) => {};
  const close = () => {};

  /* 
  // --- REAL IMPLEMENTATION ---
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };
  */

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 animate-in slide-up">
      <div className="flex-1 text-xs">
        {offlineReady ? (
          <span>App ready to work offline.</span>
        ) : (
          <span>New content available, click to update.</span>
        )}
      </div>
      {needRefresh && (
        <button 
            onClick={() => updateServiceWorker(true)}
            className="bg-white text-black px-3 py-1 rounded text-xs font-bold uppercase tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-1"
        >
            <RefreshCw size={10} /> Reload
        </button>
      )}
      <button onClick={close} className="text-zinc-400 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
};
