
import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { api } from '../services/mockBackend';
import { Heart, MessageCircle, UserPlus, Loader2 } from 'lucide-react';

interface NotificationsViewProps {
    onViewPoem: (poemId: string) => void;
    onViewProfile: (userId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onViewPoem, onViewProfile }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
        // Mark as read when opening view
        return () => { api.markNotificationsRead().catch(console.error); };
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            // Sort by newest
            data.sort((a, b) => b.createdAt - a.createdAt);
            setNotifications(data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleItemClick = async (notification: Notification) => {
        if (notification.type === 'FOLLOW') {
            onViewProfile(notification.actorId);
        } else if (notification.targetId) {
            // Fetch poem first to make sure it exists
            const poem = await api.getPoem(notification.targetId);
            if (poem) onViewPoem(notification.targetId);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <Heart size={16} className="fill-red-500 text-red-500" />;
            case 'REPLY': return <MessageCircle size={16} className="fill-blue-500 text-blue-500" />;
            case 'FOLLOW': return <UserPlus size={16} className="text-green-500" />;
            default: return null;
        }
    };

    const getText = (n: Notification) => {
        switch (n.type) {
            case 'LIKE': return <span>liked your poem <span className="text-zinc-500 italic">"{n.previewText}..."</span></span>;
            case 'REPLY': return <span>replied to your poem <span className="text-zinc-500 italic">"{n.previewText}..."</span></span>;
            case 'FOLLOW': return <span>started following you</span>;
            default: return '';
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="h-full w-full bg-black text-white overflow-y-auto no-scrollbar pt-4 pb-24">
            <h2 className="px-6 py-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-900">
                Notifications
            </h2>
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-xs italic">
                    No recent activity.
                </div>
            ) : (
                <div className="divide-y divide-zinc-900">
                    {notifications.map(n => (
                        <div 
                            key={n.id} 
                            onClick={() => handleItemClick(n)}
                            className={`p-4 flex items-start gap-4 hover:bg-zinc-900/30 cursor-pointer transition-colors ${!n.read ? 'bg-zinc-900/10' : ''}`}
                        >
                            <div className="mt-1">
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        {n.actorAvatarUrl ? <img src={n.actorAvatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-700"></div>}
                                    </div>
                                    <span className="text-xs font-bold text-zinc-200">@{n.actorName}</span>
                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-auto"></span>}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    {getText(n)}
                                </p>
                                <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-wide">
                                    {new Date(n.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
