import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src?: string;
  name: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, isOnline, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5 border-2',
    md: 'w-3.5 h-3.5 border-2',
    lg: 'w-4 h-4 border-[3px]',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={twMerge('relative inline-block', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-medium select-none overflow-hidden bg-slate-200 text-slate-600',
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={`${name}'s avatar`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span aria-label={name}>{initials}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full box-content border-2 border-white dark:border-slate-950 translate-x-[10%] translate-y-[10%]',
            isOnline ? 'bg-emerald-500' : 'bg-slate-400',
            statusSizeClasses[size]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
