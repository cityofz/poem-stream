
import { Poem, User, Keystroke, Notification } from '../types';
import { supabase } from '../lib/supabase';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const USE_REAL_BACKEND = false; 

// ------------------------------------------------------------------
// OFFLINE MANAGER
// ------------------------------------------------------------------
const CACHE_KEYS = {
    FEED: 'cache_feed',
    USER: 'cache_user',
    OFFLINE_QUEUE: 'offline_write_queue',
    DRAFT: 'current_draft',
    MOCK_POEMS: 'poem_stream_data_v1',
    MOCK_USERS: 'poem_stream_users_v1',
    AUTH_SESSION: 'poem_stream_auth_session',
    MOCK_NOTIFICATIONS: 'poem_stream_notifications_v1'
};

// In-memory fallback for environments where localStorage is blocked/cleared
const memoryCache: Record<string, any> = {};

const OfflineManager = {
    saveToCache: (key: string, data: any) => {
        memoryCache[key] = data;
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    },
    getFromCache: <T>(key: string): T | null => {
        // Try memory first
        if (memoryCache[key] !== undefined) return memoryCache[key];
        
        // Try local storage
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                memoryCache[key] = parsed; // Hydrate memory
                return parsed;
            }
        } catch(e) { return null; }
        return null;
    },
    removeFromCache: (key: string) => {
        delete memoryCache[key];
        try { localStorage.removeItem(key); } catch(e) {}
    },
    queuePoemUpload: (poem: Poem) => {
        const queue = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.OFFLINE_QUEUE) || [];
        queue.push(poem);
        OfflineManager.saveToCache(CACHE_KEYS.OFFLINE_QUEUE, queue);
    },
    syncQueue: async () => {
        if (!supabase) return;
        OfflineManager.saveToCache(CACHE_KEYS.OFFLINE_QUEUE, []);
    }
};

// ------------------------------------------------------------------
// API INTERFACE
// ------------------------------------------------------------------
export const api = {
    // Auth
    signIn: async (name: string): Promise<User> => {
        return USE_REAL_BACKEND ? realApi.signIn(name) : mockApi.signIn(name);
    },
    signUp: async (name: string): Promise<User> => {
        return USE_REAL_BACKEND ? realApi.signUp(name) : mockApi.signUp(name);
    },
    signOut: async (): Promise<void> => {
        return USE_REAL_BACKEND ? realApi.signOut() : mockApi.signOut();
    },
    getCurrentUser: async (): Promise<User> => {
        return USE_REAL_BACKEND ? realApi.getCurrentUser() : mockApi.getCurrentUser();
    },
    getUserProfile: async (userId: string): Promise<User | null> => {
        return USE_REAL_BACKEND ? realApi.getUserProfile(userId) : mockApi.getUserProfile(userId);
    },
    updateProfile: async (user: User): Promise<User> => {
        return USE_REAL_BACKEND ? realApi.updateProfile(user) : mockApi.updateProfile(user);
    },
    
    // Poems
    getFeed: async (lastCreatedAt?: number): Promise<Poem[]> => {
        return USE_REAL_BACKEND ? realApi.getFeed(lastCreatedAt) : mockApi.getFeed(lastCreatedAt);
    },
    createPoem: async (poem: Poem): Promise<Poem> => {
        return USE_REAL_BACKEND ? realApi.createPoem(poem) : mockApi.createPoem(poem);
    },
    getPoem: async (id: string): Promise<Poem | undefined> => {
        return USE_REAL_BACKEND ? realApi.getPoem(id) : mockApi.getPoem(id);
    },
    getPoemResponses: async (parentId: string): Promise<Poem[]> => {
        return USE_REAL_BACKEND ? realApi.getPoemResponses(parentId) : mockApi.getPoemResponses(parentId);
    },
    getUserPoems: async (userId: string): Promise<Poem[]> => {
        return USE_REAL_BACKEND ? realApi.getUserPoems(userId) : mockApi.getUserPoems(userId);
    },
    likePoem: async (id: string): Promise<Poem | undefined> => {
        return USE_REAL_BACKEND ? realApi.likePoem(id) : mockApi.likePoem(id);
    },
    toggleFollow: async (targetId: string): Promise<void> => {
        return USE_REAL_BACKEND ? realApi.toggleFollow(targetId) : mockApi.toggleFollow(targetId);
    },
    
    // Notifications
    getNotifications: async (): Promise<Notification[]> => {
        return USE_REAL_BACKEND ? realApi.getNotifications() : mockApi.getNotifications();
    },
    markNotificationsRead: async (): Promise<void> => {
        return USE_REAL_BACKEND ? realApi.markNotificationsRead() : mockApi.markNotificationsRead();
    },

    // Safety
    reportPoem: async (poemId: string): Promise<void> => {
        return USE_REAL_BACKEND ? realApi.reportPoem(poemId) : mockApi.reportPoem(poemId);
    },
    blockUser: async (targetId: string): Promise<void> => {
        return USE_REAL_BACKEND ? realApi.blockUser(targetId) : mockApi.blockUser(targetId);
    },
    unblockUser: async (targetId: string): Promise<void> => {
        return USE_REAL_BACKEND ? realApi.unblockUser(targetId) : mockApi.unblockUser(targetId);
    },

    // Drafts (Local Only)
    saveDraft: (draft: any) => OfflineManager.saveToCache(CACHE_KEYS.DRAFT, draft),
    getDraft: () => OfflineManager.getFromCache<any>(CACHE_KEYS.DRAFT),
    clearDraft: () => OfflineManager.removeFromCache(CACHE_KEYS.DRAFT),
    
    // Sync
    sync: async () => {
        if (USE_REAL_BACKEND) await OfflineManager.syncQueue();
    }
};

// ------------------------------------------------------------------
// MOCK API (LocalStorage)
// ------------------------------------------------------------------
const mockApi = {
    signIn: async (username: string): Promise<User> => {
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) throw new Error("Pen name not found.");
        OfflineManager.saveToCache(CACHE_KEYS.AUTH_SESSION, user.id);
        OfflineManager.saveToCache(CACHE_KEYS.USER, user);
        return user;
    },

    signUp: async (username: string): Promise<User> => {
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            throw new Error("Pen name taken.");
        }
        const newUser: User = {
            id: `user_${Date.now()}`,
            username: username,
            avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${Date.now()}&backgroundColor=b6e3f4`,
            bio: 'Just started writing.',
            followers: [],
            following: [],
            blockedUsers: [],
            preferences: { hidePrompts: false }
        };
        users.push(newUser);
        OfflineManager.saveToCache(CACHE_KEYS.MOCK_USERS, users);
        OfflineManager.saveToCache(CACHE_KEYS.AUTH_SESSION, newUser.id);
        OfflineManager.saveToCache(CACHE_KEYS.USER, newUser);
        return newUser;
    },

    signOut: async () => {
        OfflineManager.removeFromCache(CACHE_KEYS.AUTH_SESSION);
        OfflineManager.removeFromCache(CACHE_KEYS.USER);
    },

    getCurrentUser: async (): Promise<User> => {
        const sessionId = OfflineManager.getFromCache<string>(CACHE_KEYS.AUTH_SESSION);
        if (!sessionId) throw new Error("Not authenticated");
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        const user = users.find(u => u.id === sessionId);
        if (!user) {
            OfflineManager.removeFromCache(CACHE_KEYS.AUTH_SESSION);
            throw new Error("Session invalid");
        }
        if (!user.followers) user.followers = [];
        if (!user.following) user.following = [];
        if (!user.blockedUsers) user.blockedUsers = [];
        if (!user.preferences) user.preferences = {};
        return user;
    },

    getUserProfile: async (userId: string): Promise<User | null> => {
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        return users.find(u => u.id === userId) || null;
    },

    updateProfile: async (updatedUser: User): Promise<User> => {
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            OfflineManager.saveToCache(CACHE_KEYS.MOCK_USERS, users);
            OfflineManager.saveToCache(CACHE_KEYS.USER, updatedUser);
            // Update author name on poems
            const allPoems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
            let poemsChanged = false;
            const updatedPoems = allPoems.map(p => {
                if (p.authorId === updatedUser.id) {
                    poemsChanged = true;
                    return { ...p, authorName: updatedUser.username, authorAvatarUrl: updatedUser.avatarUrl };
                }
                return p;
            });
            if (poemsChanged) {
                OfflineManager.saveToCache(CACHE_KEYS.MOCK_POEMS, updatedPoems);
                OfflineManager.removeFromCache(CACHE_KEYS.FEED); 
            }
        }
        return updatedUser;
    },

    getFeed: async (lastCreatedAt?: number): Promise<Poem[]> => {
        await new Promise(resolve => setTimeout(resolve, 600)); 
        let poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        
        let blockedUsers: string[] = [];
        try {
            const currentUser = await mockApi.getCurrentUser();
            blockedUsers = currentUser.blockedUsers || [];
        } catch(e) {}

        poems = poems.filter(p => !p.parentId && !p.isReported && !blockedUsers.includes(p.authorId));
        poems.sort((a, b) => b.createdAt - a.createdAt);

        if (lastCreatedAt) {
            const index = poems.findIndex(p => p.createdAt === lastCreatedAt);
            if (index !== -1) {
                return poems.slice(index + 1, index + 11);
            }
            return [];
        }
        return poems.slice(0, 10);
    },

    createPoem: async (poem: Poem): Promise<Poem> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        const poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        poems.unshift(poem);
        
        if (poem.parentId) {
            const parentIndex = poems.findIndex(p => p.id === poem.parentId);
            if (parentIndex !== -1) {
                poems[parentIndex] = { ...poems[parentIndex], replyCount: (poems[parentIndex].replyCount || 0) + 1 };
                
                // NOTIFICATION: REPLY
                if (poems[parentIndex].authorId !== poem.authorId) {
                    mockApi.createNotification({
                        type: 'REPLY',
                        actorId: poem.authorId,
                        actorName: poem.authorName,
                        actorAvatarUrl: poem.authorAvatarUrl,
                        targetId: poem.id, // ID of the reply itself, or the parent. Let's use reply.
                        previewText: poem.text.substring(0, 30),
                        recipientId: poems[parentIndex].authorId
                    });
                }
            }
        }
        OfflineManager.saveToCache(CACHE_KEYS.MOCK_POEMS, poems);
        return poem;
    },

    getPoem: async (id: string): Promise<Poem | undefined> => {
        const poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        return poems.find(p => p.id === id);
    },

    getPoemResponses: async (parentId: string): Promise<Poem[]> => {
        await new Promise(resolve => setTimeout(resolve, 400));
        const poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        let blockedUsers: string[] = [];
        try {
            const currentUser = await mockApi.getCurrentUser();
            blockedUsers = currentUser.blockedUsers || [];
        } catch(e) {}

        return poems
            .filter(p => p.parentId === parentId && !p.isReported && !blockedUsers.includes(p.authorId))
            .sort((a, b) => a.createdAt - b.createdAt);
    },

    getUserPoems: async (userId: string): Promise<Poem[]> => {
        const poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        return poems
            .filter(p => p.authorId === userId && !p.isReported)
            .sort((a, b) => b.createdAt - a.createdAt);
    },

    likePoem: async (id: string): Promise<Poem | undefined> => {
        const poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        const index = poems.findIndex(p => p.id === id);
        if (index !== -1) {
            const updated = { ...poems[index], likes: poems[index].likes + 1 };
            poems[index] = updated;
            OfflineManager.saveToCache(CACHE_KEYS.MOCK_POEMS, poems);

            // NOTIFICATION: LIKE
            try {
                const currentUser = await mockApi.getCurrentUser();
                if (updated.authorId !== currentUser.id) {
                    mockApi.createNotification({
                        type: 'LIKE',
                        actorId: currentUser.id,
                        actorName: currentUser.username,
                        actorAvatarUrl: currentUser.avatarUrl,
                        targetId: updated.id,
                        previewText: updated.text.substring(0, 30),
                        recipientId: updated.authorId
                    });
                }
            } catch(e) {}

            return updated;
        }
        return undefined;
    },

    toggleFollow: async (targetId: string): Promise<void> => {
        const currentUser = await mockApi.getCurrentUser();
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        const targetIndex = users.findIndex(u => u.id === targetId);
        if (userIndex === -1 || targetIndex === -1) return;

        const isFollowing = users[userIndex].following.includes(targetId);
        if (isFollowing) {
            users[userIndex].following = users[userIndex].following.filter(id => id !== targetId);
            users[targetIndex].followers = users[targetIndex].followers.filter(id => id !== currentUser.id);
        } else {
            users[userIndex].following.push(targetId);
            users[targetIndex].followers.push(currentUser.id);
            
            // NOTIFICATION: FOLLOW
            mockApi.createNotification({
                type: 'FOLLOW',
                actorId: currentUser.id,
                actorName: currentUser.username,
                actorAvatarUrl: currentUser.avatarUrl,
                recipientId: targetId
            });
        }
        OfflineManager.saveToCache(CACHE_KEYS.MOCK_USERS, users);
        OfflineManager.saveToCache(CACHE_KEYS.USER, users[userIndex]);
    },

    createNotification: (data: { type: any, actorId: string, actorName: string, actorAvatarUrl?: string, targetId?: string, previewText?: string, recipientId: string }) => {
        let allNotifications = OfflineManager.getFromCache<any[]>(CACHE_KEYS.MOCK_NOTIFICATIONS) || [];
        const newNotification: Notification = {
            id: `notif_${Date.now()}_${Math.random()}`,
            createdAt: Date.now(),
            read: false,
            ...data
        };
        allNotifications.unshift(newNotification);
        // Cap notifications at 50 to prevent bloat
        if (allNotifications.length > 50) allNotifications = allNotifications.slice(0, 50);
        OfflineManager.saveToCache(CACHE_KEYS.MOCK_NOTIFICATIONS, allNotifications);
    },

    getNotifications: async (): Promise<Notification[]> => {
        const currentUser = await mockApi.getCurrentUser();
        const allNotifications = OfflineManager.getFromCache<Notification[]>(CACHE_KEYS.MOCK_NOTIFICATIONS) || [];
        return allNotifications.filter((n: any) => n.recipientId === currentUser.id);
    },

    markNotificationsRead: async (): Promise<void> => {
        const currentUser = await mockApi.getCurrentUser();
        let allNotifications = OfflineManager.getFromCache<Notification[]>(CACHE_KEYS.MOCK_NOTIFICATIONS) || [];
        allNotifications = allNotifications.map((n: any) => {
            if (n.recipientId === currentUser.id) return { ...n, read: true };
            return n;
        });
        OfflineManager.saveToCache(CACHE_KEYS.MOCK_NOTIFICATIONS, allNotifications);
    },

    reportPoem: async (poemId: string): Promise<void> => {
        const poems = OfflineManager.getFromCache<Poem[]>(CACHE_KEYS.MOCK_POEMS) || [];
        const index = poems.findIndex(p => p.id === poemId);
        if (index !== -1) {
            poems[index].isReported = true; 
            OfflineManager.saveToCache(CACHE_KEYS.MOCK_POEMS, poems);
        }
    },

    blockUser: async (targetId: string): Promise<void> => {
        const currentUser = await mockApi.getCurrentUser();
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            if (!users[userIndex].blockedUsers) users[userIndex].blockedUsers = [];
            if (!users[userIndex].blockedUsers!.includes(targetId)) {
                users[userIndex].blockedUsers!.push(targetId);
                users[userIndex].following = users[userIndex].following.filter(id => id !== targetId);
                OfflineManager.saveToCache(CACHE_KEYS.MOCK_USERS, users);
                OfflineManager.saveToCache(CACHE_KEYS.USER, users[userIndex]);
            }
        }
    },

    unblockUser: async (targetId: string): Promise<void> => {
        const currentUser = await mockApi.getCurrentUser();
        const users = OfflineManager.getFromCache<User[]>(CACHE_KEYS.MOCK_USERS) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1 && users[userIndex].blockedUsers) {
            users[userIndex].blockedUsers = users[userIndex].blockedUsers!.filter(id => id !== targetId);
            OfflineManager.saveToCache(CACHE_KEYS.MOCK_USERS, users);
            OfflineManager.saveToCache(CACHE_KEYS.USER, users[userIndex]);
        }
    }
};

// ------------------------------------------------------------------
// REAL API PLACEHOLDERS
// ------------------------------------------------------------------
const realApi = {
    signIn: async (n: string): Promise<any> => { throw new Error("Not implemented"); },
    signUp: async (n: string): Promise<any> => { throw new Error("Not implemented"); },
    signOut: async (): Promise<void> => { throw new Error("Not implemented"); },
    getCurrentUser: async (): Promise<any> => { throw new Error("Not implemented"); },
    getUserProfile: async (id: string): Promise<any> => { throw new Error("Not implemented"); },
    updateProfile: async (u: any): Promise<any> => { throw new Error("Not implemented"); },
    getFeed: async (l?: number): Promise<any> => { throw new Error("Not implemented"); },
    createPoem: async (p: any): Promise<any> => { throw new Error("Not implemented"); },
    getPoem: async (id: string): Promise<any> => { throw new Error("Not implemented"); },
    getPoemResponses: async (id: string): Promise<any> => { throw new Error("Not implemented"); },
    getUserPoems: async (id: string): Promise<any> => { throw new Error("Not implemented"); },
    likePoem: async (id: string): Promise<any> => { throw new Error("Not implemented"); },
    toggleFollow: async (id: string): Promise<void> => { throw new Error("Not implemented"); },
    getNotifications: async (): Promise<any> => { throw new Error("Not implemented"); },
    markNotificationsRead: async (): Promise<any> => { throw new Error("Not implemented"); },
    reportPoem: async (id: string): Promise<void> => { throw new Error("Not implemented"); },
    blockUser: async (id: string): Promise<void> => { throw new Error("Not implemented"); },
    unblockUser: async (id: string): Promise<void> => { throw new Error("Not implemented"); }
};
