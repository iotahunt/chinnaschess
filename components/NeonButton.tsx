import React from 'react';
import { useTheme } from '../lib/theme';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glowPulse?: boolean;
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  glowPulse = false,
  icon,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const { tokens } = useTheme();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold tracking-wider rounded-lg',
    md: 'px-5 py-2.5 text-sm font-bold tracking-wider rounded-xl',
    lg: 'px-8 py-3.5 text-base font-extrabold tracking-widest rounded-xl',
  }[size];

  let variantStyle: React.CSSProperties = {};

  if (variant === 'primary') {
    variantStyle = {
      backgroundColor: tokens.neonPrimary,
      color: tokens.mode === 'dark' ? '#09070f' : '#ffffff',
      boxShadow: disabled ? 'none' : tokens.neonBoxShadow,
      border: `1px solid ${tokens.neonPrimary}`,
    };
  } else if (variant === 'secondary') {
    variantStyle = {
      backgroundColor: 'transparent',
      color: tokens.text,
      border: `1.5px solid ${tokens.cardBorder}`,
      boxShadow: disabled ? 'none' : '0 0 8px rgba(255, 102, 178, 0.15)',
    };
  } else if (variant === 'danger') {
    variantStyle = {
      backgroundColor: 'rgba(255, 40, 40, 0.15)',
      color: '#ff4444',
      border: '1px solid #ff4444',
      boxShadow: disabled ? 'none' : '0 0 12px rgba(255, 40, 40, 0.4)',
    };
  } else {
    variantStyle = {
      backgroundColor: 'transparent',
      color: tokens.textSecondary,
      border: 'none',
    };
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{ ...variantStyle, ...style }}
      className={`
        relative inline-flex items-center justify-center gap-2 cursor-pointer
        transition-all duration-200 active:scale-95 select-none
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        ${glowPulse && !disabled ? 'animate-pulse' : ''}
        ${sizeClasses}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      )}
      {!loading && icon && <span className="inline-flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
