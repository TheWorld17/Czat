import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs, 
  setDoc, 
  getDoc,
  Timestamp,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { User, Chat, Message, MessageStatus } from '../types';

class ChatService {
  // --- Auth ---
  
  getCurrentUser(): User | null {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return this.mapFirebaseUser(fbUser);
  }

  // Слухач стану авторизації
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged((fbUser) => {
      callback(fbUser ? this.mapFirebaseUser(fbUser) : null);
    });
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await this.updateUserStatus(userCredential.user.uid, true);
    return this.mapFirebaseUser(userCredential.user);
  }

  async register(email: string, password: string, displayName: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Створюємо документ користувача в Firestore
    const newUser: User = {
      userId: userCredential.user.uid,
      displayName,
      email,
      photoURL: '',
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...newUser,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return newUser;
  }

  async logout(): Promise<void> {
    try {
      if (auth.currentUser) {
        // Try to update status, but don't block logout if it fails (e.g. permission error)
        await this.updateUserStatus(auth.currentUser.uid, false);
      }
    } catch (e) {
      console.warn("Could not update user status on logout", e);
    }
    
    // Always sign out
    await signOut(auth);
  }

  private async updateUserStatus(userId: string, isOnline: boolean) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    });
  }

  // --- Chats ---

  // Підписка на список чатів
  subscribeToChats(callback: (chats: Chat[]) => void): () => void {
    const user = auth.currentUser;
    if (!user) return () => {};

    // REMOVED orderBy('lastMessageAt', 'desc') to avoid needing a composite index in Firestore.
    // We will sort the results client-side instead.
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', user.uid)
    );

    return onSnapshot(q, async (snapshot) => {
      
      // Нам потрібно отримати дані іншого користувача для кожного чату
      const promises = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const otherUserId = data.participants.find((uid: string) => uid !== user.uid);
        
        let otherUser: User | undefined;
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, 'users', otherUserId));
          if (userSnap.exists()) {
            otherUser = this.mapFirestoreUser(userSnap.data(), otherUserId);
          }
        }

        // Логіка лічильника непрочитаних (спрощена: зберігаємо map unreadCounts у документі чату)
        // Структура в БД: unreadCounts: { [userId]: number }
        const myUnreadCount = data.unreadCounts?.[user.uid] || 0;

        return {
          chatId: docSnap.id,
          participants: data.participants,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
          lastMessageSender: data.lastMessageSender,
          createdAt: data.createdAt?.toDate() || new Date(),
          otherUser,
          unreadCount: myUnreadCount
        } as Chat;
      });

      const resolvedChats = await Promise.all(promises);
      
      // Client-side sorting
      resolvedChats.sort((a, b) => {
        const timeA = a.lastMessageAt ? a.lastMessageAt.getTime() : 0;
        const timeB = b.lastMessageAt ? b.lastMessageAt.getTime() : 0;
        return timeB - timeA;
      });

      callback(resolvedChats);
    });
  }

  // Пошук користувачів для початку чату
  async searchUsers(searchTerm: string): Promise<User[]> {
    if (!searchTerm) return [];
    // Firestore не має повнотекстового пошуку, тому це простий пошук
    // У реальному додатку краще використовувати Algolia або просто шукати по email
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('email', '>=', searchTerm), 
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => this.mapFirestoreUser(d.data(), d.id))
      .filter(u => u.userId !== auth.currentUser?.uid);
  }

  // Створення або отримання існуючого чату
  async createChat(otherUserId: string): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user");

    // Перевірка чи чат вже існує
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(otherUserId);
    });

    if (existingChat) return existingChat.id;

    // Створення нового
    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUser.uid, otherUserId],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastMessageSender: '',
      unreadCounts: {
        [currentUser.uid]: 0,
        [otherUserId]: 0
      }
    });

    return newChatRef.id;
  }

  // --- Messages ---

  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          messageId: doc.id,
          text: data.text,
          senderId: data.senderId,
          receiverId: data.receiverId,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status as MessageStatus
        };
      });
      callback(messages);
    });
  }

  async sendMessage(chatId: string, text: string, receiverId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 1. Додати повідомлення
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text,
      senderId: currentUser.uid,
      receiverId,
      createdAt: serverTimestamp(),
      status: MessageStatus.SENT
    });

    // 2. Оновити метадані чату (останнє повідомлення + інкремент лічильника для отримувача)
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const currentUnread = chatSnap.data()?.unreadCounts?.[receiverId] || 0;

    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      lastMessageSender: currentUser.uid,
      [`unreadCounts.${receiverId}`]: currentUnread + 1
    });
  }

  async markMessagesAsRead(chatId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Скидання лічильника unread для поточного користувача
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCounts.${currentUser.uid}`]: 0
    });
    
    // Примітка: Оновлення статусу кожного окремого повідомлення на 'READ'
    // може бути дорогим (багато операцій запису). 
    // Зазвичай достатньо знати lastReadTimestamp, але для демо оновлювати статус повідомлень не будемо масово,
    // лише скинемо лічильник.
  }

  // --- Helpers ---

  private mapFirebaseUser(user: FirebaseUser): User {
    return {
      userId: user.uid,
      displayName: user.displayName || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(user.metadata.creationTime || Date.now())
    };
  }

  private mapFirestoreUser(data: any, userId: string): User {
    return {
      userId: userId,
      displayName: data.displayName || 'User',
      email: data.email || '',
      photoURL: data.photoURL || '',
      isOnline: data.isOnline || false,
      lastSeen: data.lastSeen?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date()
    };
  }
}

export const chatService = new ChatService();
