// Data models matching the requested Firestore structure

export interface User {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string;
  isOnline: boolean;
  lastSeen: Date; // Firestore Timestamp converted to Date
  createdAt: Date;
  typingUsers?: { [userId: string]: boolean };
  blockedUsers?: string[]; // Array of blocked user IDs
  publicKey?: string; // Base64 public key for E2EE
  privacySettings?: {
    showLastSeen?: 'everyone' | 'nobody';
    showPhoto?: 'everyone' | 'nobody';
    showOnline?: 'everyone' | 'nobody';
  };
}

export interface Chat {
  chatId: string;
  type: 'direct' | 'group'; // Chat type
  participants: string[]; // Array of user IDs
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageSender: string;
  createdAt: Date;

  // Group chat specific fields
  name?: string; // Group name
  description?: string; // Group description
  admins?: string[]; // Array of admin user IDs

  // Per-user settings (stored as maps in Firestore)
  isArchived?: boolean; // Whether current user has archived
  isMuted?: boolean; // Whether current user has muted
  isPinned?: boolean; // Whether current user has pinned

  // UI helper props (joined data)
  otherUser?: User; // For direct chats
  groupMembers?: User[]; // For group chats
  unreadCount?: number;
  typingUsers?: { [userId: string]: boolean };
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export interface Message {
  messageId: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  status: MessageStatus;
  replyTo?: {
    messageId: string;
    text: string;
    senderDisplayName: string;
  };
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
  type?: 'text';
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  forwardedFrom?: string; // chatId of the original chat
  isEncrypted?: boolean;
  expiresAt?: Date;
}

export interface UserChat {
  userId: string;
  chatId: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  otherUserId: string;
}
