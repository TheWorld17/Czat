import React, { useState } from 'react';
import { Smile, Heart, Star, Pizza, Car, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = [
    { name: 'Recent', icon: Star, emojis: ['❤️', '😂', '👍', '🙏', '🔥', '🥰', '😊', '😭'] },
    { name: 'Smileys', icon: Smile, emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🥳', '😏', '😒'] },
    { name: 'Hearts', icon: Heart, emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'] },
    { name: 'Food', icon: Pizza, emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'] },
    { name: 'Travel', icon: Car, emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲'] }
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].name);
    const [search, setSearch] = useState('');

    const filteredEmojis = search
        ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter((_, i) => i % 5 === 0) // Placeholder logic for search
        : EMOJI_CATEGORIES.find(c => c.name === activeCategory)?.emojis || [];

    return (
        <div className="absolute bottom-full right-0 mb-4 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col animate-bounce-in z-[60]">
            {/* Search */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                    placeholder="Search emojis..."
                    className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Emoji Grid */}
            <div className="flex-1 p-2 h-60 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-6 gap-1">
                    {filteredEmojis.map((emoji, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(emoji)}
                            className="p-2 text-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all hover:scale-125 active:scale-90"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Categories */}
            <div className="p-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-around border-t border-slate-100 dark:border-slate-800">
                {EMOJI_CATEGORIES.map(category => (
                    <button
                        key={category.name}
                        onClick={() => { setActiveCategory(category.name); setSearch(''); }}
                        className={clsx(
                            "p-2 rounded-xl transition-all",
                            activeCategory === category.name && !search ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-400 hover:text-slate-600"
                        )}
                        title={category.name}
                    >
                        <category.icon className="w-5 h-5" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EmojiPicker;
