import React, { useEffect } from 'react';
import { useTheme } from '../lib/theme';

export interface AuraFlashData {
  id: string;
  isPositive: boolean; // true = I captured (+aura), false = I was captured (-aura)
  delta: number;
  pieceName?: string;
}

interface AuraFlashProps {
  data: AuraFlashData | null;
  onDismiss: () => void;
}

export const AuraFlash: React.FC<AuraFlashProps> = ({ data, onDismiss }) => {
  const { tokens } = useTheme();

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 1800);
    return () => clearTimeout(timer);
  }, [data, onDismiss]);

  if (!data) return null;

  const isGain = data.isPositive;
  const accentColor = isGain ? tokens.auraGreen : tokens.auraRed;
  const glowShadow = isGain
    ? '0 0 40px rgba(0, 255, 157, 0.8), 0 0 90px rgba(0, 255, 157, 0.4)'
    : '0 0 40px rgba(255, 51, 102, 0.8), 0 0 90px rgba(255, 51, 102, 0.4)';

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-pointer animate-fadeIn backdrop-blur-sm"
      style={{
        backgroundColor: isGain
          ? 'rgba(0, 30, 20, 0.65)'
          : 'rgba(35, 5, 15, 0.65)',
      }}
    >
      {/* Background Shockwave rings */}
      <div
        className="absolute w-96 h-96 rounded-full animate-ping opacity-25"
        style={{ border: `3px solid ${accentColor}` }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-pulse opacity-20"
        style={{ border: `1px solid ${accentColor}` }}
      />

      <div className="relative flex flex-col items-center justify-center p-8 text-center select-none transform transition-all animate-bounce-short">
        <div
          className="text-xs uppercase tracking-[0.3em] font-extrabold mb-2"
          style={{ color: tokens.textSecondary }}
        >
          {isGain ? 'AURA ABSORPTION' : 'AURA PENALTY'}
        </div>

        <div
          className="text-5xl sm:text-7xl font-black tracking-tight"
          style={{
            color: accentColor,
            textShadow: glowShadow,
            fontFamily: "'Cinzel', 'Outfit', sans-serif",
          }}
        >
          {isGain ? `+${data.delta}` : `-${data.delta}`}
        </div>

        <div
          className="text-lg sm:text-2xl font-bold mt-2 tracking-widest uppercase"
          style={{
            color: tokens.text,
            textShadow: `0 0 12px ${tokens.neonPrimary}`,
          }}
        >
          AURA POINTS
        </div>

        {data.pieceName && (
          <div
            className="mt-3 px-4 py-1 rounded-full text-xs font-semibold tracking-wider"
            style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: `1px solid ${accentColor}88`,
              color: tokens.textSecondary,
            }}
          >
            {isGain ? `Captured enemy ${data.pieceName}` : `Lost your ${data.pieceName}`}
          </div>
        )}
      </div>
    </div>
  );
};
