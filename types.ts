// Data models matching the requested Firestore structure

export interface User {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string;
  isOnline: boolean;
  lastSeen: Date; // Firestore Timestamp converted to Date
  createdAt: Date;
}

export interface Chat {
  chatId: string;
  participants: string[]; // [userAId, userBId]
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageSender: string;
  createdAt: Date;
  
  // UI helper props (joined data)
  otherUser?: User; 
  unreadCount?: number;
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
}

export interface UserChat {
  userId: string;
  chatId: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  otherUserId: string;
}
