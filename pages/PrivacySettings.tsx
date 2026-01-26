import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { ArrowLeft, Shield, Eye, EyeOff, Key, Clock, Check } from 'lucide-react';
import { User } from '../types';

const PrivacySettings = () => {
    const navigate = useNavigate();
    const currentUser = chatService.getCurrentUser();
    const [userFullData, setUserFullData] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [e2eeEnabled, setE2eeEnabled] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchUserData();
        setE2eeEnabled(!!localStorage.getItem(`e2ee_priv_${currentUser?.userId}`));
    }, []);

    const fetchUserData = async () => {
        if (!currentUser) return;
        // In a real app, we'd have a subscribeToUserProfile
        // For now, we'll just use the getCurrentUser or fetch once
        // Since we need the privacySettings field which might not be in the basic auth user
        // we'll fetch from Firestore
        const userDoc = await chatService.searchUsers(currentUser.email); // Hack to find self
        const self = userDoc.find(u => u.userId === currentUser.userId);
        if (self) setUserFullData(self);
    };

    const handleTogglePrivacy = async (key: keyof NonNullable<User['privacySettings']>, value: 'everyone' | 'nobody') => {
        if (!userFullData) return;

        const newSettings = {
            ...userFullData.privacySettings,
            [key]: value
        };

        try {
            await chatService.updatePrivacySettings(newSettings);
            setUserFullData({ ...userFullData, privacySettings: newSettings });
            setStatusMessage({ text: 'Settings updated', type: 'success' });
        } catch (error) {
            setStatusMessage({ text: 'Failed to update settings', type: 'error' });
        }
    };

    const handleEnableE2EE = async () => {
        setLoading(true);
        try {
            await chatService.generateE2EEKeys();
            setE2eeEnabled(true);
            setStatusMessage({ text: 'E2EE Keys generated and stored securely', type: 'success' });
        } catch (error) {
            setStatusMessage({ text: 'Failed to generate keys', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetE2EE = async () => {
        if (!window.confirm("Warning: Resetting keys will make you unable to read previous encrypted messages. Proceed?")) return;
        handleEnableE2EE();
    };

    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate('/profile')}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Privacy & Security</h1>
            </header>

            {statusMessage && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-bold animate-fade-in ${statusMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {statusMessage.text}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-10">
                <div className="max-w-md mx-auto p-6 space-y-10">

                    {/* E2EE Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">End-to-End Encryption</h2>
                                <p className="text-xs text-slate-500">Secure your private conversations</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Encrypted Messaging</p>
                                    <p className="text-xs text-slate-500 mt-1">Messages are encrypted locally before sending.</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${e2eeEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {e2eeEnabled ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    {e2eeEnabled ? 'Active' : 'Not Active'}
                                </div>
                            </div>

                            {!e2eeEnabled ? (
                                <Button fullWidth onClick={handleEnableE2EE} isLoading={loading}>
                                    Enable Encryption
                                </Button>
                            ) : (
                                <button
                                    onClick={handleResetE2EE}
                                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Key className="w-4 h-4" />
                                    Regenerate Security Keys
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Visibility Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                                <Eye className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visibility</h2>
                                <p className="text-xs text-slate-500">Control who can see your activity</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'showLastSeen', label: 'Last Seen status', icon: Clock },
                                { id: 'showOnline', label: 'Online Status', icon: Shield },
                                { id: 'showPhoto', label: 'Profile Photo', icon: (props: any) => <Avatar name="User" size="sm" {...props} /> }
                            ].map((item) => {
                                const currentVal = userFullData?.privacySettings?.[item.id as keyof User['privacySettings']] || 'everyone';
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-1">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                                        </div>
                                        <select
                                            value={currentVal}
                                            onChange={(e) => handleTogglePrivacy(item.id as any, e.target.value as any)}
                                            className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="everyone">Everyone</option>
                                            <option value="nobody">Nobody</option>
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Experimental Section */}
                    <section className="space-y-4 opacity-75">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Self-Destruct (Coming Soon)</h2>
                                <p className="text-xs text-slate-500">Default message lifetime</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dotted border-slate-200 dark:border-slate-800">
                            Automatic message deletion timer will be configurable per chat soon.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettings;
