import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { Chat, User, Message } from '../types';
import { chatService } from '../services/chatService';
import Avatar from '../components/Avatar';
import CreateGroupModal from '../components/CreateGroupModal';
import { Search, LogOut, UserPlus, X, Moon, Sun, Users, Pin, VolumeX, MessageSquare, Archive } from 'lucide-react';
import { AuthContext } from '../App';
import { useTheme } from '../services/ThemeContext';
import { clsx } from 'clsx';

const ChatList = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [globalSearchResults, setGlobalSearchResults] = useState<{ chat: Chat; messages: Message[] }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [view, setView] = useState<'active' | 'archived'>('active');

  const navigate = useNavigate();
  const { logout, user: currentUser } = React.useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  // Real-time listener for chats
  useEffect(() => {
    const unsubscribe = chatService.subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle Global Search (Users + Messages)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setIsSearching(true);
        try {
          // Parallel search for users and all messages
          const [userResults, messageResults] = await Promise.all([
            chatService.searchUsers(searchTerm),
            chatService.searchAllMessages(searchTerm)
          ]);
          setSearchResults(userResults);
          setGlobalSearchResults(messageResults);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setGlobalSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleStartChat = async (otherUserId: string) => {
    try {
      const chatId = await chatService.createChat(otherUserId);
      setSearchTerm(''); // Clear search
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const filteredChats = chats.filter(chat =>
    view === 'active' ? !chat.isArchived : chat.isArchived
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-200 uppercase-no-more">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Chats</h1>
            {view === 'archived' && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">Archived</span>
            )}
          </div>
          <div className="flex gap-2">
            <button title="Toggle Theme" onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button title="New Group" onClick={() => setIsCreateGroupOpen(true)} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button title="Profile" onClick={() => navigate('/profile')} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <UserPlus className="w-5 h-5" />
            </button>
            <button title="Logout" onClick={logout} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-4 mb-4 text-sm font-medium">
          <button
            onClick={() => setView('active')}
            className={view === 'active' ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 pb-1"}
          >
            Active
          </button>
          <button
            onClick={() => setView('archived')}
            className={view === 'archived' ? "text-blue-600 border-b-2 border-blue-600 pb-1" : "text-slate-500 pb-1"}
          >
            Archived ({chats.filter(c => c.isArchived).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search users or messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-base md:text-sm rounded-xl py-3 md:py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:placeholder-slate-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Search Results Overlay */}
        {searchTerm.length > 2 && (
          <div className="absolute z-20 top-0 left-0 right-0 bottom-0 bg-white dark:bg-slate-950 p-0 overflow-y-auto animate-fade-in shadow-xl">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p>Searching globally...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {/* People Section */}
                {searchResults.length > 0 && (
                  <div className="p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">People</h3>
                    <ul className="space-y-1">
                      {searchResults.map(user => (
                        <li key={user.userId}>
                          <button
                            onClick={() => handleStartChat(user.userId)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-left"
                          >
                            <Avatar name={user.displayName} src={user.photoURL} size="md" />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{user.displayName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                            <UserPlus className="w-5 h-5 text-blue-500 ml-auto" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Messages Section */}
                {globalSearchResults.length > 0 && (
                  <div className="p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Messages</h3>
                    <ul className="space-y-1">
                      {globalSearchResults.map(result => (
                        <li key={result.chat.chatId} className="mb-2">
                          <div className="px-1 mb-1 text-[10px] font-bold text-slate-400 uppercase">
                            Chat with {result.chat.type === 'group' ? result.chat.name : result.chat.otherUser?.displayName}
                          </div>
                          {result.messages.map(msg => (
                            <button
                              key={msg.messageId}
                              onClick={() => handleChatClick(result.chat.chatId)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-left bg-slate-50/50 dark:bg-slate-900/30 mb-1"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 dark:text-white line-clamp-2">
                                  {msg.text}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                                </p>
                              </div>
                              <MessageSquare className="w-4 h-4 text-slate-300" />
                            </button>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {searchResults.length === 0 && globalSearchResults.length === 0 && (
                  <div className="text-center py-20 text-slate-500">
                    <p className="font-medium">No results found</p>
                    <p className="text-sm mt-1">Try searching for something else</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chats List */}
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-full" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 px-6 text-center py-20 opacity-60">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-200 dark:text-slate-800" />
            <p className="font-medium">{view === 'active' ? 'No active messages' : 'Archive is empty'}</p>
            <p className="text-sm mt-1">Start a new conversation to see them here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50 dark:divide-slate-900">
            {filteredChats.map((chat) => {
              const displayName = chat.type === 'group' ? chat.name : chat.otherUser?.displayName;
              const photoURL = chat.type === 'group' ? undefined : chat.otherUser?.photoURL;
              const isOnline = chat.type === 'group' ? false : chat.otherUser?.isOnline;
              const typingCount = Object.values(chat.typingUsers || {}).filter(t => t).length;

              return (
                <li key={chat.chatId} className="group/item relative">
                  <button
                    onClick={() => handleChatClick(chat.chatId)}
                    className="w-full px-4 py-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left active:bg-slate-100 dark:active:bg-slate-900"
                  >
                    <Avatar
                      name={displayName || 'User'}
                      src={photoURL}
                      isOnline={isOnline}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white truncate">
                            {displayName || 'Unknown'}
                          </h3>
                          {chat.isPinned && <Pin className="w-3 h-3 text-blue-500 fill-blue-500" />}
                          {chat.isMuted && <VolumeX className="w-3 h-3 text-slate-400" />}
                        </div>
                        {chat.lastMessageAt && (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm truncate pr-2">
                          {typingCount > 0 ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                              {chat.type === 'group' ? `${typingCount} typing...` : 'Typing...'}
                            </span>
                          ) : (
                            <p className={chat.unreadCount ? 'text-slate-900 dark:text-gray-100 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                              {chat.lastMessageSender === currentUser?.userId && <span className="text-slate-400 font-normal mr-1">You:</span>}
                              {chat.lastMessage || <span className='italic text-slate-400'>No messages yet</span>}
                            </p>
                          )}
                        </div>
                        {chat.unreadCount ? (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            {chat.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>

                  {/* Context Actions */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity pr-2">
                    <button
                      onClick={() => chatService.togglePinChat(chat.chatId, !chat.isPinned)}
                      title={chat.isPinned ? "Unpin" : "Pin"}
                      className={clsx(
                        "p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors",
                        chat.isPinned ? "text-blue-600" : "text-slate-400"
                      )}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => chatService.toggleMuteChat(chat.chatId, !chat.isMuted)}
                      title={chat.isMuted ? "Unmute" : "Mute"}
                      className={clsx(
                        "p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors",
                        chat.isMuted ? "text-blue-600" : "text-slate-400"
                      )}
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => chatService.toggleArchiveChat(chat.chatId, !chat.isArchived)}
                      title={chat.isArchived ? "Unarchive" : "Archive"}
                      className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={(id) => {
          setIsCreateGroupOpen(false);
          navigate(`/chat/${id}`);
        }}
        onError={(err) => alert(err)}
      />
    </div>
  );
};

export default ChatList;
