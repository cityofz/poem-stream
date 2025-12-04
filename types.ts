export type ViewState = 'FEED' | 'RECORD' | 'PROFILE' | 'POEM_DETAILS' | 'SETTINGS' | 'NOTIFICATIONS';

export interface UserPreferences {
  hidePrompts?: boolean;
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  followers: string[];
  following: string[];
  blockedUsers?: string[];
  preferences?: UserPreferences;
}

export interface Keystroke {
  deleteCount: number;
  addText: string;
  delay: number;
}

export interface Poem {
  id: string;
  text: string;
  prompt: string;
  keystrokes: Keystroke[];
  createdAt: number;
  likes: number;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  parentId?: string;
  replyCount: number;
  isReported?: boolean;
}

export type NotificationType = 'LIKE' | 'REPLY' | 'FOLLOW';

export interface Notification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorAvatarUrl?: string;
  targetId?: string;
  createdAt: number;
  read: boolean;
  previewText?: string;
}