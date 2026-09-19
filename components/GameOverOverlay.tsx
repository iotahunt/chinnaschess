import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useTheme } from '../lib/theme';
import { NeonButton } from './NeonButton';
import { soundEngine } from '../lib/sound';

interface GameOverOverlayProps {
  isOpen: boolean;
  isWinner: boolean;
  isDraw: boolean;
  drawReason?: string;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  isOpen,
  isWinner,
  isDraw,
  drawReason,
  onPlayAgain,
  onReturnToLobby,
}) => {
  const { tokens } = useTheme();

  useEffect(() => {
    if (isOpen) {
      if (isWinner && !isDraw) {
        soundEngine.playDomainExpansion();
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: [tokens.neonPrimary, '#ffffff', tokens.auraGreen, '#ff00ff'],
          });
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen, isWinner, isDraw, tokens]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md p-8 rounded-3xl border text-center select-none overflow-hidden shadow-2xl animate-scaleUp"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: isWinner && !isDraw ? tokens.neonPrimary : tokens.cardBorder,
          boxShadow: isWinner && !isDraw ? tokens.neonGlowStrong : tokens.neonBoxShadow,
        }}
      >
        {/* Neon decorative background glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none opacity-25"
          style={{
            background: `radial-gradient(circle, ${isWinner ? tokens.neonPrimary : tokens.auraRed} 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <span
            className="text-xs font-black uppercase tracking-[0.3em] px-3.5 py-1 rounded-full mb-3"
            style={{
              backgroundColor: isDraw
                ? 'rgba(255,255,255,0.1)'
                : isWinner
                ? `${tokens.neonPrimary}25`
                : 'rgba(255,50,50,0.2)',
              color: isDraw ? tokens.textSecondary : isWinner ? tokens.neonPrimary : '#ff4444',
              border: `1px solid ${isDraw ? tokens.cardBorder : isWinner ? tokens.neonPrimary : '#ff4444'}`,
            }}
          >
            {isDraw ? 'MATCH DRAW' : isWinner ? 'VICTORY ACHIEVED' : 'DEFEAT'}
          </span>

          {/* Heading */}
          <h2
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{
              color: tokens.text,
              fontFamily: "'Cinzel', 'Outfit', sans-serif",
              textShadow: isWinner ? tokens.neonTextShadow : undefined,
            }}
          >
            {isDraw ? 'STALEMATE' : isWinner ? 'CHECKMATE' : 'FALLEN'}
          </h2>

          {/* Domain Expansion Message as specified in requirements */}
          <div
            className="mt-6 p-4 rounded-2xl w-full border"
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderColor: isWinner && !isDraw ? `${tokens.neonPrimary}66` : tokens.cardBorder,
            }}
          >
            <div className="text-[11px] uppercase font-bold tracking-widest" style={{ color: tokens.textMuted }}>
              DOMAIN MANIFESTATION
            </div>
            <div
              className="text-xl sm:text-2xl font-black mt-1"
              style={{
                color: isDraw ? tokens.textSecondary : isWinner ? tokens.neonPrimary : '#ff5577',
                fontFamily: "'Outfit', sans-serif",
                textShadow: isWinner ? `0 0 16px ${tokens.neonPrimary}` : undefined,
              }}
            >
              {isDraw
                ? `Draw – no domain expansion${drawReason ? ` (${drawReason})` : ''}`
                : isWinner
                ? 'Domain expansion by +67'
                : "Opponent's domain expanded by +67"}
            </div>
          </div>

          <p className="text-xs mt-4 mb-6" style={{ color: tokens.textSecondary }}>
            {isWinner && !isDraw
              ? 'Your realm expands deeper into the infinite neon void.'
              : isDraw
              ? 'Balanced minds. Neither territory yielded territory.'
              : 'Analyze the defeat. Refine your aura strategy for the rematch.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <NeonButton
              variant="primary"
              size="md"
              glowPulse={isWinner}
              className="w-full sm:flex-1"
              onClick={onPlayAgain}
            >
              Rematch
            </NeonButton>
            <NeonButton
              variant="secondary"
              size="md"
              className="w-full sm:flex-1"
              onClick={onReturnToLobby}
            >
              Lobby
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
};
