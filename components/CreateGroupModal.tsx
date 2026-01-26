import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { chatService } from '../services/chatService';
import Avatar from './Avatar';
import { X, Users, Check, Search, Plus } from 'lucide-react';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (chatId: string) => void;
    onError: (error: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onError
}) => {
    const [step, setStep] = useState<'details' | 'members'>('details');
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Search for users
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setIsSearching(true);
                try {
                    const results = await chatService.searchUsers(searchTerm);
                    // Filter out already selected members
                    const filtered = results.filter(
                        u => !selectedMembers.some(m => m.userId === u.userId)
                    );
                    setSearchResults(filtered);
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, selectedMembers]);

    const addMember = (user: User) => {
        setSelectedMembers(prev => [...prev, user]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeMember = (userId: string) => {
        setSelectedMembers(prev => prev.filter(m => m.userId !== userId));
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) return;

        setIsCreating(true);
        try {
            const chatId = await chatService.createGroupChat(
                groupName.trim(),
                description.trim(),
                selectedMembers.map(m => m.userId)
            );
            onSuccess(chatId);
            onClose();
            resetForm();
        } catch (error) {
            console.error('Failed to create group', error);
            onError('Failed to create group');
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setStep('details');
        setGroupName('');
        setDescription('');
        setSearchTerm('');
        setSearchResults([]);
        setSelectedMembers([]);
    };

    const handleClose = () => {
        onClose();
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md mx-4 shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {step === 'details' ? 'New Group' : 'Add Members'}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'details' ? (
                    <>
                        {/* Group Details Form */}
                        <div className="flex-1 p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Group Name *
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Enter group name"
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's this group about?"
                                    rows={3}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => setStep('members')}
                                disabled={!groupName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                            >
                                Next: Add Members
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Member Selection */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* Selected Members */}
                        {selectedMembers.length > 0 && (
                            <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800">
                                {selectedMembers.map(member => (
                                    <div
                                        key={member.userId}
                                        className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-sm"
                                    >
                                        <span>{member.displayName}</span>
                                        <button
                                            onClick={() => removeMember(member.userId)}
                                            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search Results */}
                        <div className="flex-1 overflow-y-auto">
                            {isSearching ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {searchResults.map(user => (
                                        <li key={user.userId}>
                                            <button
                                                onClick={() => addMember(user)}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                            >
                                                <Avatar name={user.displayName} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                        {user.displayName}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <Plus className="w-5 h-5 text-blue-600" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : searchTerm.length > 2 ? (
                                <div className="text-center py-8 text-slate-500">No users found</div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    Search for users to add to the group
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                                onClick={() => setStep('details')}
                                className="text-blue-600 font-medium"
                            >
                                Back
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">
                                    {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                                </span>
                                <button
                                    onClick={handleCreate}
                                    disabled={selectedMembers.length === 0 || isCreating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Create Group
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateGroupModal;
