import React, { useState, useEffect } from 'react';
import { Chat } from '../types';
import { chatService } from '../services/chatService';
import Avatar from './Avatar';
import { X, Forward, Check, Search } from 'lucide-react';
import { clsx } from 'clsx';

interface ForwardModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: string;
    chatId: string;
    messageText: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}

const ForwardModal: React.FC<ForwardModalProps> = ({
    isOpen,
    onClose,
    messageId,
    chatId,
    messageText,
    onSuccess,
    onError
}) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChats, setSelectedChats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [forwarding, setForwarding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadChats();
        }
    }, [isOpen]);

    const loadChats = async () => {
        setLoading(true);
        try {
            const allChats = await chatService.getChatsForForward();
            // Filter out the current chat
            setChats(allChats.filter(c => c.chatId !== chatId));
        } catch (err) {
            console.error('Failed to load chats', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleChatSelection = (selectedChatId: string) => {
        setSelectedChats(prev =>
            prev.includes(selectedChatId)
                ? prev.filter(id => id !== selectedChatId)
                : [...prev, selectedChatId]
        );
    };

    const handleForward = async () => {
        if (selectedChats.length === 0) return;

        setForwarding(true);
        try {
            const result = await chatService.forwardMessage(chatId, messageId, selectedChats);
            if (result.success) {
                onSuccess();
                onClose();
                setSelectedChats([]);
            } else {
                onError(result.error || 'Failed to forward message');
            }
        } catch (err) {
            console.error('Forward failed', err);
            onError('Failed to forward message');
        } finally {
            setForwarding(false);
        }
    };

    const filteredChats = chats.filter(chat =>
        chat.otherUser?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md mx-4 shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Forward className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Forward Message</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message Preview */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Forwarding:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{messageText}</p>
                </div>

                {/* Search */}
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No chats available to forward to
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredChats.map((chat) => (
                                <li key={chat.chatId}>
                                    <button
                                        onClick={() => toggleChatSelection(chat.chatId)}
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                    >
                                        <Avatar
                                            name={chat.otherUser?.displayName || 'User'}
                                            src={chat.otherUser?.photoURL}
                                            isOnline={chat.otherUser?.isOnline}
                                            size="md"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                {chat.otherUser?.displayName || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {chat.otherUser?.email}
                                            </p>
                                        </div>
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                            selectedChats.includes(chat.chatId)
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-slate-300 dark:border-slate-600"
                                        )}>
                                            {selectedChats.includes(chat.chatId) && <Check className="w-4 h-4" />}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        {selectedChats.length} chat{selectedChats.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={handleForward}
                        disabled={selectedChats.length === 0 || forwarding}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        {forwarding ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Forwarding...
                            </>
                        ) : (
                            <>
                                <Forward className="w-4 h-4" />
                                Forward
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
