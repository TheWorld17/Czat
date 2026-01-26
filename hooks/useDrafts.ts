import { useState, useEffect, useCallback } from 'react';

const DRAFT_KEY_PREFIX = 'chat_draft_';

/**
 * Custom hook to manage message drafts in localStorage
 * Automatically saves and loads drafts per chat
 */
export function useDrafts(chatId: string | undefined) {
    const [draft, setDraft] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    const storageKey = chatId ? `${DRAFT_KEY_PREFIX}${chatId}` : null;

    // Load draft from localStorage when chatId changes
    useEffect(() => {
        if (!storageKey) {
            setDraft('');
            setIsLoaded(true);
            return;
        }

        try {
            const savedDraft = localStorage.getItem(storageKey);
            setDraft(savedDraft || '');
        } catch (error) {
            console.error('Failed to load draft from localStorage', error);
            setDraft('');
        }
        setIsLoaded(true);
    }, [storageKey]);

    // Save draft to localStorage (debounced to avoid too many writes)
    const saveDraft = useCallback((text: string) => {
        setDraft(text);

        if (!storageKey) return;

        try {
            if (text.trim()) {
                localStorage.setItem(storageKey, text);
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch (error) {
            console.error('Failed to save draft to localStorage', error);
        }
    }, [storageKey]);

    // Clear draft when message is sent
    const clearDraft = useCallback(() => {
        setDraft('');

        if (!storageKey) return;

        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Failed to clear draft from localStorage', error);
        }
    }, [storageKey]);

    // Get all drafts (for displaying draft indicator in chat list)
    const getAllDrafts = useCallback((): { [chatId: string]: string } => {
        const drafts: { [chatId: string]: string } = {};

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        const draftChatId = key.replace(DRAFT_KEY_PREFIX, '');
                        drafts[draftChatId] = value;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to get all drafts', error);
        }

        return drafts;
    }, []);

    return {
        draft,
        saveDraft,
        clearDraft,
        getAllDrafts,
        isLoaded
    };
}

export default useDrafts;
