import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { Chat, Message, MessageStatus, User } from '../types';
import { chatService } from '../services/chatService';
import Avatar from '../components/Avatar';
import ForwardModal from '../components/ForwardModal';
import GroupInfoPanel from '../components/GroupInfoPanel';
import { ArrowLeft, Send, Phone, Video, Info, Check, CheckCheck, Reply, SmilePlus, X, Trash2, Pencil, Search, Forward, MoreVertical, Timer, Ban, Eraser } from 'lucide-react';
import { clsx } from 'clsx';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { parseMarkdown } from '../utils/markdown';
import EmojiPicker from '../components/EmojiPicker';

const ChatScreen = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [chatInfo, setChatInfo] = useState<Chat | undefined>(undefined);
  const [showInfo, setShowInfo] = useState(false);
  const [selfDestructMinutes, setSelfDestructMinutes] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Edit message state
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // Forward message state
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  // Toast notification for errors
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = chatService.getCurrentUser();

  // Fetch Chat Info
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'chats', chatId), async (chatSnap) => {
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        const type = data.type || 'direct';

        let otherUser: User | undefined;
        let groupMembers: User[] = [];

        if (type === 'direct') {
          const otherUserId = data.participants.find((p: string) => p !== currentUser.userId);
          if (otherUserId) {
            const userSnap = await getDoc(doc(db, 'users', otherUserId));
            if (userSnap.exists()) {
              otherUser = { userId: otherUserId, ...userSnap.data() } as User;
            }
          }
        } else {
          // Resolve group members
          const memberPromises = data.participants.map(async (uid: string) => {
            const userSnap = await getDoc(doc(db, 'users', uid));
            return userSnap.exists() ? { userId: uid, ...userSnap.data() } as User : null;
          });
          const resolved = await Promise.all(memberPromises);
          groupMembers = resolved.filter((u): u is User => u !== null);
        }

        setChatInfo({
          chatId: chatSnap.id,
          ...data,
          type,
          otherUser,
          groupMembers
        } as Chat);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  // Messages Real-time Listener
  useEffect(() => {
    if (!chatId) return;

    // Mark read
    chatService.markMessagesAsRead(chatId);

    // Subscribe
    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      // Client-side cleanup of self-destructed messages
      const now = Date.now();
      const activeMessages = newMessages.filter(m => !m.expiresAt || new Date(m.expiresAt).getTime() > now);
      setMessages(activeMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const getUserDisplayName = (userId: string) => {
    if (userId === currentUser?.userId) return 'You';
    if (chatInfo?.type === 'direct') return chatInfo.otherUser?.displayName || 'User';
    const member = chatInfo?.groupMembers?.find(m => m.userId === userId);
    return member?.displayName || 'User';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !chatId || !chatInfo) return;

    const tempText = text.trim();
    setText('');

    // If editing, update the message
    if (editingMessage) {
      try {
        const result = await chatService.editMessage(chatId, editingMessage.messageId, tempText);
        if (!result.success) {
          setToast({ message: result.error || 'Failed to edit message', type: 'error' });
          setText(tempText);
        } else {
          setToast({ message: 'Message edited', type: 'success' });
        }
      } catch (err) {
        console.error("Failed to edit", err);
        setText(tempText);
        setToast({ message: 'Failed to edit message', type: 'error' });
      }
      setEditingMessage(null);
      return;
    }

    setReplyingTo(null);

    try {
      const receiverId = chatInfo.type === 'direct'
        ? chatInfo.otherUser?.userId || ''
        : 'group';

      const replyData = replyingTo ? {
        messageId: replyingTo.messageId,
        text: replyingTo.text,
        senderDisplayName: replyingTo.senderId === currentUser?.userId ? 'You' : getUserDisplayName(replyingTo.senderId)
      } : undefined;

      const expiry = selfDestructMinutes ? new Date(Date.now() + selfDestructMinutes * 60000) : undefined;

      await chatService.sendMessage(chatId, tempText, receiverId, replyData, expiry);
    } catch (err) {
      console.error("Failed to send", err);
      setText(tempText);
      setToast({ message: 'Failed to send message', type: 'error' });
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

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!chatId || !currentUser) return;
    const msg = messages.find(m => m.messageId === messageId);
    if (!msg) return;

    const hasReacted = msg.reactions?.[emoji]?.includes(currentUser.userId);
    if (hasReacted) {
      await chatService.removeReaction(chatId, messageId, emoji);
    } else {
      await chatService.addReaction(chatId, messageId, emoji);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!chatId) return;
    const result = await chatService.deleteMessage(chatId, messageId);
    if (!result.success) {
      setToast({ message: result.error || 'Failed to delete message', type: 'error' });
    }
  };

  const handleStartEdit = (msg: Message) => {
    const createdAt = new Date(msg.createdAt);
    const timeDiff = Date.now() - createdAt.getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    if (timeDiff > fifteenMinutes) {
      setToast({ message: 'Messages can only be edited within 15 minutes', type: 'error' });
      return;
    }

    setEditingMessage(msg);
    setReplyingTo(null);
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | undefined) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const prevDate = new Date(prevMsg.createdAt);
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  if (!chatId) return null;

  const headerTitle = chatInfo?.type === 'group' ? chatInfo.name : chatInfo?.otherUser?.displayName;
  const headerSub = chatInfo?.type === 'group'
    ? `${chatInfo.participants.length} members`
    : (chatInfo?.typingUsers?.[chatInfo.otherUser?.userId || '']
      ? <span className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">Typing...</span>
      : (chatInfo?.otherUser?.isOnline ? 'Active now' : 'Offline'));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toast Notification */}
        {toast && (
          <div className={clsx(
            "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in",
            toast.type === 'error' ? "bg-red-500 text-white" : "bg-green-500 text-white"
          )}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <header className="flex-none bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-4 py-3 z-20 flex items-center justify-between shadow-sm dark:shadow-slate-900/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <Avatar
                name={headerTitle || 'User'}
                src={chatInfo?.type === 'direct' ? chatInfo?.otherUser?.photoURL : undefined}
                isOnline={chatInfo?.type === 'direct' ? chatInfo?.otherUser?.isOnline : false}
                size="sm"
              />
              <div className="min-w-0 pr-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {headerTitle || 'Loading...'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight truncate">
                  {headerSub}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <button
              onClick={() => {
                const durations = [null, 1, 5, 60, 1440];
                const currentIndex = durations.indexOf(selfDestructMinutes);
                const nextIndex = (currentIndex + 1) % durations.length;
                setSelfDestructMinutes(durations[nextIndex]);
              }}
              className={clsx(
                "p-2 rounded-full transition-all relative group",
                selfDestructMinutes ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20" : "hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-400"
              )}
              title={selfDestructMinutes ? `Self-destruct: ${selfDestructMinutes}m` : "Self-destruct Off"}
            >
              <Timer className="w-5 h-5" />
              {selfDestructMinutes && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                  {selfDestructMinutes >= 60 ? (selfDestructMinutes / 60 + 'h') : selfDestructMinutes}
                </span>
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="hidden sm:block p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="hidden sm:block p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  showInfo ? "bg-blue-50 dark:bg-slate-800 text-blue-600" : "hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-400"
                )}
              >
                {chatInfo?.type === 'group' ? <Info className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
              </button>

              {showInfo && chatInfo?.type === 'direct' && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-bounce-in">
                  <button
                    onClick={async () => {
                      if (window.confirm('Clear all messages in this chat? This cannot be undone.')) {
                        setShowInfo(false);
                        const res = await chatService.clearChatHistory(chatId);
                        if (res.success) setToast({ message: 'History cleared', type: 'success' });
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Eraser className="w-4 h-4 text-blue-500" />
                    <span>Clear History</span>
                  </button>
                  <button
                    onClick={() => { setShowInfo(false); chatInfo.otherUser && chatService.toggleBlockUser(chatInfo.otherUser.userId, true).then(() => setToast({ message: 'User blocked', type: 'success' })); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Ban className="w-4 h-4 text-orange-500" />
                    <span>Block User</span>
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                  <button
                    onClick={async () => {
                      if (window.confirm('Delete this chat completely? This cannot be undone.')) {
                        const res = await chatService.deleteChat(chatId);
                        if (res.success) navigate('/');
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Chat</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.userId;
            const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId);
            const showDateSeparator = shouldShowDateSeparator(msg, messages[idx - 1]);
            const senderName = chatInfo?.type === 'group' && !isMe ? getUserDisplayName(msg.senderId) : null;
            const senderAvatar = chatInfo?.groupMembers?.find(m => m.userId === msg.senderId)?.photoURL;

            return (
              <React.Fragment key={msg.messageId}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
                      {formatDateSeparator(new Date(msg.createdAt))}
                    </div>
                  </div>
                )}

                <div className={clsx("flex w-full animate-fade-in group/message relative", isMe ? "justify-end" : "justify-start")}>
                  <div className={clsx("flex max-w-[85%] md:max-w-[75%] gap-2 relative", isMe ? "flex-row-reverse" : "flex-row")}>

                    {/* Actions Menu */}
                    <div className={clsx(
                      "absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity z-10",
                      isMe ? "right-full mr-2" : "left-full ml-2"
                    )}>
                      {!msg.deletedAt && (
                        <>
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:text-blue-500 transition-colors">
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleReaction(msg.messageId, '❤️')} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:text-red-500 transition-colors">
                            <SmilePlus className="w-3.5 h-3.5" />
                          </button>
                          {isMe && (
                            <button onClick={() => handleStartEdit(msg)} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:text-blue-500 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setForwardingMessage(msg)} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:text-green-500 transition-colors">
                            <Forward className="w-3.5 h-3.5" />
                          </button>
                          {isMe && (
                            <button onClick={() => handleDelete(msg.messageId)} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:text-red-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {!isMe && (
                      <div className="w-8 flex-shrink-0 flex items-end">
                        {showAvatar && <Avatar name={getUserDisplayName(msg.senderId)} src={senderAvatar} size="sm" className="w-8 h-8 text-[10px]" />}
                      </div>
                    )}

                    <div className={clsx(
                      "group relative px-4 py-2.5 shadow-sm text-[15px] leading-relaxed",
                      isMe ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800"
                    )}>
                      {senderName && <p className="text-[11px] font-bold text-blue-500 mb-0.5">{senderName}</p>}

                      {msg.replyTo && (
                        <div className={clsx("mb-2 pl-2 border-l-2 text-xs opacity-80", isMe ? "border-blue-400 text-blue-100" : "border-slate-300 text-slate-500")}>
                          <p className="font-bold">{msg.replyTo.senderDisplayName}</p>
                          <p className="line-clamp-1">{msg.replyTo.text}</p>
                        </div>
                      )}

                      {msg.forwardedFrom && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] opacity-70">
                          <Forward className="w-2.5 h-2.5" />
                          <span>Forwarded</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap break-words">
                        {msg.deletedAt ? (
                          <span className="italic opacity-60">Message deleted</span>
                        ) : (
                          <>
                            {parseMarkdown(msg.text)}
                            {/* Simple Link Preview */}
                            {msg.text.match(/https?:\/\/[^\s]+/g)?.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 block p-3 bg-white/10 dark:bg-black/20 rounded-xl border border-white/20 dark:border-white/5 backdrop-blur-sm group/link hover:bg-white/20 transition-all"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Search className="w-3 h-3 text-blue-300" />
                                  </div>
                                  <span className="text-[11px] font-bold truncate opacity-80 uppercase tracking-tighter">Link Preview</span>
                                </div>
                                <p className="text-xs mt-1 truncate text-blue-100 dark:text-blue-300 underline decoration-blue-500/30 underline-offset-2">{url}</p>
                              </a>
                            ))}
                          </>
                        )}
                      </div>

                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="absolute -bottom-3 right-0 mr-2 flex gap-1 z-10">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            (users as string[]).length > 0 && (
                              <div key={emoji} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center group/react hover:scale-110 transition-transform cursor-pointer">
                                <span>{emoji}</span>
                                <span className="ml-1 text-slate-500 dark:text-slate-400 font-bold">{(users as string[]).length}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}

                      <div className={clsx(
                        "flex items-center gap-1.5 mt-1 text-[10px]",
                        isMe ? "justify-end text-blue-100/70" : "text-slate-400"
                      )}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                        {msg.isEncrypted && <span title="End-to-end encrypted">🔒</span>}
                        {msg.expiresAt && (
                          <span className="flex items-center gap-0.5 text-orange-400 font-bold" title="Self-destructing">
                            <Timer className="w-2.5 h-2.5" />
                            {Math.max(0, Math.ceil((new Date(msg.expiresAt).getTime() - Date.now()) / 60000))}m
                          </span>
                        )}
                        {isMe && <span>{getStatusIcon(msg.status)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 pb-safe z-10">
          {(editingMessage || replyingTo) && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-t-2xl mb-2 mx-1 border-l-4 border-blue-500">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {editingMessage ? 'Editing' : `Replying to ${replyingTo?.senderId === currentUser?.userId ? 'You' : getUserDisplayName(replyingTo?.senderId || '')}`}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{editingMessage?.text || replyingTo?.text}</p>
              </div>
              <button onClick={() => { setEditingMessage(null); setReplyingTo(null); if (editingMessage) setText(''); }} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-[24px] p-1.5 pl-4 relative border border-slate-200/50 dark:border-slate-800/50">
            <input
              ref={inputRef}
              className="flex-1 bg-transparent py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none"
              placeholder="Type a message... (supports markdown)"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (chatId && !editingMessage) chatService.setTypingStatus(chatId, true);
              }}
              onBlur={() => chatId && chatService.setTypingStatus(chatId, false)}
              disabled={!navigator.onLine}
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  showEmojiPicker ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" : "text-slate-400 hover:text-blue-500"
                )}
              >
                <SmilePlus className="w-6 h-6" />
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => {
                    setText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2.5 bg-blue-600 rounded-full text-white shadow-md disabled:opacity-50 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>

        {forwardingMessage && chatId && (
          <ForwardModal
            isOpen={!!forwardingMessage}
            onClose={() => setForwardingMessage(null)}
            messageId={forwardingMessage.messageId}
            chatId={chatId}
            messageText={forwardingMessage.text}
            onSuccess={() => setToast({ message: 'Message forwarded!', type: 'success' })}
            onError={(error) => setToast({ message: error, type: 'error' })}
          />
        )}
      </div>

      {showInfo && chatInfo && chatInfo.type === 'group' && (
        <GroupInfoPanel
          chat={chatInfo}
          onClose={() => setShowInfo(false)}
          onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
          onError={(err) => setToast({ message: err, type: 'error' })}
        />
      )}
    </div>
  );
};

export default ChatScreen;
