import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Chat, User } from '../types';
import { chatService } from '../services/chatService';
import Avatar from '../components/Avatar';
import { Edit, Search, LogOut, UserPlus, X } from 'lucide-react';
import { AuthContext } from '../App';

const ChatList = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();
  const { logout } = React.useContext(AuthContext);

  // Real-time listener for chats
  useEffect(() => {
    const unsubscribe = chatService.subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle User Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setIsSearching(true);
        try {
          const results = await chatService.searchUsers(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Chats</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={logout} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users by email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 text-slate-900 text-sm rounded-xl py-2 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Results Overlay */}
        {searchTerm.length > 0 && (
          <div className="absolute z-20 top-[110px] left-0 right-0 bottom-0 bg-white/95 backdrop-blur-sm p-4">
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Found Users</h3>
             {isSearching ? (
               <div className="text-center py-4 text-slate-500">Searching...</div>
             ) : searchResults.length === 0 ? (
               <div className="text-center py-4 text-slate-500">No users found</div>
             ) : (
               <ul>
                 {searchResults.map(user => (
                   <li key={user.userId}>
                     <button
                        onClick={() => handleStartChat(user.userId)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                     >
                       <Avatar name={user.displayName} size="md" />
                       <div>
                         <p className="font-semibold text-slate-900">{user.displayName}</p>
                         <p className="text-sm text-slate-500">{user.email}</p>
                       </div>
                       <UserPlus className="w-5 h-5 text-blue-500 ml-auto" />
                     </button>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        )}

        {/* Chats List */}
        {loading ? (
           <div className="p-4 space-y-4">
             {[1, 2, 3].map((i) => (
               <div key={i} className="flex gap-3 animate-pulse">
                 <div className="w-12 h-12 bg-slate-200 rounded-full" />
                 <div className="flex-1 space-y-2 py-1">
                   <div className="h-4 bg-slate-200 rounded w-1/3" />
                   <div className="h-3 bg-slate-200 rounded w-3/4" />
                 </div>
               </div>
             ))}
           </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 px-6 text-center">
            <MessageCircle className="w-12 h-12 mb-3 text-slate-300" />
            <p>No chats yet.</p>
            <p className="text-sm mt-1">Use the search bar to find friends by email and start messaging!</p>
          </div>
        ) : (
          <ul>
            {chats.map((chat) => (
              <li key={chat.chatId}>
                <button
                  onClick={() => handleChatClick(chat.chatId)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <Avatar 
                    name={chat.otherUser?.displayName || 'User'} 
                    src={chat.otherUser?.photoURL} 
                    isOnline={chat.otherUser?.isOnline} 
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold text-slate-900 truncate pr-2">
                        {chat.otherUser?.displayName || 'Unknown User'}
                      </h3>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate pr-2 ${chat.unreadCount ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                        {chat.lastMessageSender === chatService.getCurrentUser()?.userId && <span className="text-slate-400 mr-1">You:</span>}
                        {chat.lastMessage || <span className='italic text-slate-400'>No messages yet</span>}
                      </p>
                      {chat.unreadCount ? (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Quick helper icon component since I can't import MessageCircle locally in JSX without defining it or importing
import { MessageCircle } from 'lucide-react';

export default ChatList;
