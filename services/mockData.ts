import { User, Chat, Message, MessageStatus } from '../types';

export const CURRENT_USER_ID = 'user_me_123';

export const MOCK_USERS: Record<string, User> = {
  [CURRENT_USER_ID]: {
    userId: CURRENT_USER_ID,
    displayName: 'Alex Designer',
    email: 'alex@example.com',
    photoURL: 'https://picsum.photos/id/64/200/200',
    isOnline: true,
    lastSeen: new Date(),
    createdAt: new Date('2023-01-01'),
  },
  'user_1': {
    userId: 'user_1',
    displayName: 'Sarah Connor',
    email: 'sarah@example.com',
    photoURL: 'https://picsum.photos/id/65/200/200',
    isOnline: true,
    lastSeen: new Date(),
    createdAt: new Date('2023-01-05'),
  },
  'user_2': {
    userId: 'user_2',
    displayName: 'John Doe',
    email: 'john@example.com',
    photoURL: 'https://picsum.photos/id/91/200/200',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    createdAt: new Date('2023-02-10'),
  },
  'user_3': {
    userId: 'user_3',
    displayName: 'Emily Blunt',
    email: 'emily@example.com',
    photoURL: 'https://picsum.photos/id/129/200/200',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    createdAt: new Date('2023-03-20'),
  }
};

export const MOCK_CHATS: Chat[] = [
  {
    chatId: 'chat_1',
    participants: [CURRENT_USER_ID, 'user_1'],
    lastMessage: 'Sounds good! See you then.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
    lastMessageSender: 'user_1',
    createdAt: new Date('2023-05-01'),
    unreadCount: 2,
    otherUser: MOCK_USERS['user_1'],
  },
  {
    chatId: 'chat_2',
    participants: [CURRENT_USER_ID, 'user_2'],
    lastMessage: 'Hey, did you get the file?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    lastMessageSender: CURRENT_USER_ID,
    createdAt: new Date('2023-06-15'),
    unreadCount: 0,
    otherUser: MOCK_USERS['user_2'],
  },
  {
    chatId: 'chat_3',
    participants: [CURRENT_USER_ID, 'user_3'],
    lastMessage: 'Lunch tomorrow?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    lastMessageSender: 'user_3',
    createdAt: new Date('2023-07-20'),
    unreadCount: 0,
    otherUser: MOCK_USERS['user_3'],
  }
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'chat_1': [
    {
      messageId: 'm1',
      text: 'Hey Alex! Are we still on for the meeting?',
      senderId: 'user_1',
      receiverId: CURRENT_USER_ID,
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
      status: MessageStatus.READ,
    },
    {
      messageId: 'm2',
      text: 'Yes, absolutely.',
      senderId: CURRENT_USER_ID,
      receiverId: 'user_1',
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
      status: MessageStatus.READ,
    },
    {
      messageId: 'm3',
      text: 'Great. What time works best?',
      senderId: 'user_1',
      receiverId: CURRENT_USER_ID,
      createdAt: new Date(Date.now() - 1000 * 60 * 6),
      status: MessageStatus.DELIVERED,
    },
    {
      messageId: 'm4',
      text: 'Sounds good! See you then.',
      senderId: 'user_1',
      receiverId: CURRENT_USER_ID,
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      status: MessageStatus.DELIVERED,
    }
  ],
  'chat_2': [
    {
      messageId: 'm2_1',
      text: 'Hey, did you get the file?',
      senderId: CURRENT_USER_ID,
      receiverId: 'user_2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: MessageStatus.SENT, // Sent but maybe not delivered/read (offline check simulation)
    }
  ],
  'chat_3': [
      {
      messageId: 'm3_1',
      text: 'Lunch tomorrow?',
      senderId: 'user_3',
      receiverId: CURRENT_USER_ID,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      status: MessageStatus.READ,
    }
  ]
};
