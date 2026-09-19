import React, { useState } from 'react';
import { useTheme } from '../lib/theme';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const NeonInput: React.FC<NeonInputProps> = ({
  label,
  error,
  icon,
  className = '',
  style,
  ...props
}) => {
  const { tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          className="text-xs font-semibold tracking-wider uppercase select-none"
          style={{ color: tokens.textSecondary }}
        >
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        {icon && (
          <div
            className="absolute left-3.5 pointer-events-none transition-colors"
            style={{ color: isFocused ? tokens.neonPrimary : tokens.textMuted }}
          >
            {icon}
          </div>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={{
            backgroundColor: tokens.cardBg,
            color: tokens.text,
            borderColor: error
              ? '#ff3366'
              : isFocused
              ? tokens.neonPrimary
              : tokens.cardBorder,
            boxShadow: isFocused
              ? `0 0 14px ${tokens.neonPrimary}55, inset 0 0 8px ${tokens.neonPrimary}22`
              : 'none',
            ...style,
          }}
          className={`
            w-full px-4 py-2.5 rounded-xl border text-sm font-medium
            transition-all duration-200 outline-none
            placeholder:text-opacity-40
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <span className="text-xs font-medium text-rose-500 mt-0.5 animate-fadeIn">
          {error}
        </span>
      )}
    </div>
  );
};
