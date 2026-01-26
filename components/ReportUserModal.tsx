import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { chatService } from '../services/chatService';

interface ReportUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    onSuccess: () => void;
}

const REPORT_REASONS = [
    'Spam',
    'Harassment',
    'Inappropriate content',
    'Hate speech',
    'Other'
];

const ReportUserModal: React.FC<ReportUserModalProps> = ({
    isOpen,
    onClose,
    userId,
    userName,
    onSuccess
}) => {
    const [reason, setReason] = useState(REPORT_REASONS[0]);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await chatService.reportUser(userId, reason, description);
            if (result.success) {
                setIsDone(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    resetForm();
                }, 2000);
            } else {
                alert(result.error || 'Failed to submit report');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setReason(REPORT_REASONS[0]);
        setDescription('');
        setIsDone(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Report User</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isDone ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center animate-bounce-in">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Report Submitted</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Thank you for helping keep our community safe. We will review your report shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            You are reporting <span className="font-bold text-slate-900 dark:text-white">{userName}</span>.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Reason
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {REPORT_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Additional details
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell us more about the issue..."
                                rows={4}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                            />
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-2.5 text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportUserModal;
