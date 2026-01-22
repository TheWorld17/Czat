import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={twMerge(
          'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/10',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500 ml-1">{error}</p>}
    </div>
  );
};

export default Input;
