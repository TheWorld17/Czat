
export const parseMarkdown = (text: string) => {
    if (!text) return text;

    // We'll replace with placeholders and then map to components
    // To keep it simple for this task, we'll use a simpler approach using split/map

    return text.split('\n').map((line, i) => (
        <div key={i}>
            {line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~)/).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-extrabold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={j} className="italic text-slate-200 dark:text-slate-300">{part.slice(1, -1)}</em>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={j} className="bg-black/20 dark:bg-white/10 px-1 rounded font-mono text-[13px]">{part.slice(1, -1)}</code>;
                }
                if (part.startsWith('~~') && part.endsWith('~~')) {
                    return <del key={j} className="opacity-50 line-through">{part.slice(2, -2)}</del>;
                }
                return part;
            })}
        </div>
    ));
};
