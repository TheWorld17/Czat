import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import { ArrowLeft, Ban, ShieldAlert, UserCheck } from 'lucide-react';
import { User } from '../types';

const Profile = () => {
    const navigate = useNavigate();
    const currentUser = chatService.getCurrentUser();
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        setLoadingBlocked(true);
        try {
            const users = await chatService.getBlockedUsers();
            setBlockedUsers(users);
        } catch (error) {
            console.error("Failed to fetch blocked users", error);
        } finally {
            setLoadingBlocked(false);
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await chatService.toggleBlockUser(userId, false);
            setBlockedUsers(prev => prev.filter(u => u.userId !== userId));
        } catch (error) {
            alert("Failed to unblock user");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;

        setLoading(true);
        try {
            await chatService.updateUserProfile(displayName);
            // Show some success feedback if needed
            alert("Profile updated!");
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
            </header>

            <div className="flex-1 overflow-y-auto pb-10">
                <div className="max-w-md mx-auto p-6 space-y-10">
                    {/* Basic Info form */}
                    <section>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <Avatar
                                        name={displayName || 'User'}
                                        src={currentUser?.photoURL}
                                        size="lg"
                                        className="w-24 h-24 text-4xl shadow-xl"
                                    />
                                </div>
                                <div className="text-center">
                                    <h2 className="font-bold text-slate-900 dark:text-white">{currentUser?.email}</h2>
                                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">General Account</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Display Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your name"
                                    required
                                />

                                <Button type="submit" fullWidth isLoading={loading} disabled={loading}>
                                    Save Profile
                                </Button>
                            </div>
                        </form>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Privacy & Security Link */}
                    <section>
                        <button
                            onClick={() => navigate('/privacy')}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Privacy & Security</p>
                                    <p className="text-[10px] text-slate-500">Encryption, visibility, and more</p>
                                </div>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                        </button>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Blocked Users Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Ban className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Blocked Users</h3>
                        </div>

                        {loadingBlocked ? (
                            <div className="py-4 text-center text-slate-500 animate-pulse">Loading...</div>
                        ) : blockedUsers.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-800">
                                <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">You haven't blocked anyone yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {blockedUsers.map(user => (
                                    <li key={user.userId} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={user.displayName} src={user.photoURL} size="sm" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.displayName}</p>
                                                <p className="text-[10px] text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnblock(user.userId)}
                                            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full transition-colors"
                                        >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            Unblock
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;
