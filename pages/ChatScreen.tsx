import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Chat, Message, MessageStatus } from '../types';
import { chatService } from '../services/chatService';
import Avatar from '../components/Avatar';
import { ArrowLeft, Send, Phone, Video, Info, WifiOff, Check, CheckCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const ChatScreen = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [chatInfo, setChatInfo] = useState<Chat | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = chatService.getCurrentUser();

  // Network Status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Chat Info
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const fetchChatInfo = async () => {
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        
        if (chatSnap.exists()) {
            const data = chatSnap.data();
            const otherUserId = data.participants.find((p: string) => p !== currentUser.userId);
            
            let otherUser;
            if (otherUserId) {
                const userSnap = await getDoc(doc(db, 'users', otherUserId));
                if (userSnap.exists()) {
                    otherUser = userSnap.data();
                }
            }

            setChatInfo({
                chatId: chatSnap.id,
                ...data,
                otherUser: otherUser ? { userId: otherUserId, ...otherUser } : undefined
            } as Chat);
        }
    };
    fetchChatInfo();
  }, [chatId]);

  // Messages Real-time Listener
  useEffect(() => {
    if (!chatId) return;

    // Mark read
    chatService.markMessagesAsRead(chatId);

    // Subscribe
    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
        setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !chatId || !chatInfo?.otherUser?.userId) return;

    const tempText = text;
    setText(''); 

    try {
        await chatService.sendMessage(chatId, tempText, chatInfo.otherUser.userId);
    } catch (err) {
        console.error("Failed to send", err);
        setText(tempText); // Restore text on fail
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.SENDING:
        return <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />;
      case MessageStatus.SENT:
        return <Check className="w-3.5 h-3.5 text-slate-400" />;
      case MessageStatus.DELIVERED:
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
      case MessageStatus.READ:
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!chatId) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
             <Avatar 
                name={chatInfo?.otherUser?.displayName || 'User'} 
                src={chatInfo?.otherUser?.photoURL}
                isOnline={chatInfo?.otherUser?.isOnline}
                size="sm"
             />
             <div>
               <h2 className="text-sm font-bold text-slate-900 leading-tight">
                 {chatInfo?.otherUser?.displayName || 'Loading...'}
               </h2>
               <p className="text-xs text-slate-500 leading-tight">
                 {chatInfo?.otherUser?.isOnline ? 'Active now' : ''}
               </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-blue-600">
           <button className="p-2.5 rounded-full hover:bg-blue-50 transition-colors">
             <Phone className="w-5 h-5" />
           </button>
           <button className="p-2.5 rounded-full hover:bg-blue-50 transition-colors">
             <Video className="w-5 h-5" />
           </button>
           <button className="p-2.5 rounded-full hover:bg-blue-50 text-slate-400 transition-colors">
             <Info className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-slate-800 text-white text-xs py-1 px-4 flex items-center justify-center gap-2 animate-slide-up">
          <WifiOff className="w-3 h-3" />
          <span>No internet connection. Messages will be sent when you're back online.</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {messages.length === 0 && (
           <div className="text-center text-slate-400 mt-10 text-sm">
             Send a message to start the conversation!
           </div>
         )}

         {messages.map((msg, idx) => {
           const isMe = msg.senderId === currentUser?.userId;
           const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId);

           return (
             <div 
                key={msg.messageId} 
                className={clsx(
                  "flex w-full animate-fade-in",
                  isMe ? "justify-end" : "justify-start"
                )}
             >
               <div className={clsx("flex max-w-[75%] gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                 {/* Avatar placeholder for alignment */}
                 {!isMe && (
                   <div className="w-8 flex-shrink-0 flex items-end">
                     {showAvatar && <Avatar name={chatInfo?.otherUser?.displayName || ''} src={chatInfo?.otherUser?.photoURL} size="sm" className="w-8 h-8 text-[10px]" />}
                   </div>
                 )}

                 <div className={clsx(
                   "group relative px-4 py-2.5 shadow-sm text-[15px] leading-relaxed",
                   isMe 
                     ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                     : "bg-white text-slate-900 rounded-2xl rounded-tl-sm border border-slate-100"
                 )}>
                   {msg.text}
                   
                   <div className={clsx(
                     "flex items-center gap-1 mt-1 text-[10px]",
                     isMe ? "justify-end text-blue-100" : "text-slate-400"
                   )}>
                     {format(msg.createdAt, 'h:mm a')}
                     {isMe && <span>{getStatusIcon(msg.status)}</span>}
                   </div>
                 </div>
               </div>
             </div>
           );
         })}
         <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-none p-3 bg-white border-t border-slate-100 pb-safe">
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-slate-100 rounded-[24px] p-1.5 pl-4"
        >
          <input
            className="flex-1 bg-transparent py-2.5 min-h-[44px] max-h-32 text-slate-900 placeholder-slate-500 focus:outline-none resize-none overflow-hidden"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!isOnline && false} 
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 bg-blue-600 rounded-full text-white shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all active:scale-95"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
