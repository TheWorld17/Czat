import React, { useState } from 'react';
import { Chat } from '../types';
import { chatService } from '../services/chatService';
import Avatar from './Avatar';
import ReportUserModal from './ReportUserModal';
import { X, UserMinus, Shield, ShieldAlert, LogOut, Trash2, Ban, Flag } from 'lucide-react';

interface GroupInfoPanelProps {
    chat: Chat;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (error: string) => void;
}

const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({
    chat,
    onClose,
    onSuccess,
    onError
}) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [reportingUser, setReportingUser] = useState<{ id: string, name: string } | null>(null);

    const currentUser = chatService.getCurrentUser();
    const isAdmin = chat.admins?.includes(currentUser?.userId || '');

    const handleRemoveMember = async (userId: string) => {
        setLoading(userId);
        try {
            const result = await chatService.removeGroupMember(chat.chatId, userId);
            if (result.success) {
                onSuccess('Member removed');
            } else {
                onError(result.error || 'Failed to remove member');
            }
        } catch (err) {
            onError('Error removing member');
        } finally {
            setLoading(null);
        }
    };

    const handleMakeAdmin = async (userId: string) => {
        setLoading(userId);
        try {
            const result = await chatService.makeAdmin(chat.chatId, userId);
            if (result.success) {
                onSuccess('Admin status granted');
            } else {
                onError(result.error || 'Failed to make admin');
            }
        } catch (err) {
            onError('Error making admin');
        } finally {
            setLoading(null);
        }
    };

    const handleBlockUser = async (userId: string) => {
        if (!window.confirm('Block this user? They will no longer be able to message you directly.')) return;

        setLoading(userId);
        try {
            await chatService.toggleBlockUser(userId, true);
            onSuccess('User blocked');
        } catch (err) {
            onError('Failed to block user');
        } finally {
            setLoading(null);
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;

        setLoading('leave');
        try {
            const result = await chatService.leaveGroup(chat.chatId);
            if (result.success) {
                window.location.href = '/'; // Navigate back to list
            } else {
                onError(result.error || 'Failed to leave group');
            }
        } catch (err) {
            onError('Error leaving group');
        } finally {
            setLoading(null);
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm('Clear all messages for everyone? This cannot be undone.')) return;

        setLoading('clear');
        try {
            const result = await chatService.clearChatHistory(chat.chatId);
            if (result.success) {
                onSuccess('Chat history cleared');
            } else {
                onError(result.error || 'Failed to clear history');
            }
        } catch (err) {
            onError('Error clearing history');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="w-80 border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full animate-slide-left overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 dark:text-white">Group Info</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Info Section */}
                <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
                    <div className="mb-4">
                        <Avatar name={chat.name || 'Group'} size="lg" className="w-20 h-20 text-2xl shadow-lg ring-4 ring-slate-50 dark:ring-slate-900" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white text-center break-words w-full px-2">{chat.name}</h3>
                    <p className="text-sm text-slate-500 text-center mt-2 px-2 italic">{chat.description || 'No description provided'}</p>
                    <div className="mt-4 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">{chat.participants.length} Members</p>
                    </div>
                </div>

                {/* Member List */}
                <div className="p-4">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest">Members Directory</h4>
                    <ul className="space-y-1">
                        {chat.groupMembers?.map(member => {
                            const itemIsAdmin = chat.admins?.includes(member.userId);
                            const isSelf = member.userId === currentUser?.userId;

                            return (
                                <li key={member.userId} className="group/member p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={member.displayName} src={member.photoURL} isOnline={member.isOnline} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                                {member.displayName} {isSelf && <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">You</span>}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">{itemIsAdmin ? 'Group Admin' : 'Member'}</p>
                                        </div>
                                        {itemIsAdmin && !isSelf && (
                                            <ShieldAlert className="w-4 h-4 text-blue-500/30" />
                                        )}
                                    </div>

                                    {!isSelf && (
                                        <div className="flex gap-1 justify-end mt-2 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                            {isAdmin && (
                                                <>
                                                    {!itemIsAdmin && (
                                                        <button
                                                            onClick={() => handleMakeAdmin(member.userId)}
                                                            disabled={!!loading}
                                                            title="Make Admin"
                                                            className="p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveMember(member.userId)}
                                                        disabled={!!loading}
                                                        title="Remove Member"
                                                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleBlockUser(member.userId)}
                                                disabled={!!loading}
                                                title="Block User"
                                                className="p-1.5 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/10 text-orange-500 transition-colors"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setReportingUser({ id: member.userId, name: member.displayName })}
                                                disabled={!!loading}
                                                title="Report User"
                                                className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 transition-colors"
                                            >
                                                <Flag className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Primary Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                {isAdmin && (
                    <button
                        onClick={handleClearHistory}
                        disabled={!!loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-200 dark:border-red-900/30"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Chat History
                    </button>
                )}
                <button
                    onClick={handleLeaveGroup}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Leave Group
                </button>
            </div>

            {/* Modals */}
            {reportingUser && (
                <ReportUserModal
                    isOpen={!!reportingUser}
                    onClose={() => setReportingUser(null)}
                    userId={reportingUser.id}
                    userName={reportingUser.name}
                    onSuccess={() => {
                        onSuccess('Report submitted');
                        setReportingUser(null);
                    }}
                />
            )}
        </div>
    );
};

export default GroupInfoPanel;
