import React from 'react';
import { useTheme } from '../lib/theme';

interface DomainBannerProps {
  expansions: number;
  compact?: boolean;
}

export const DomainBanner: React.FC<DomainBannerProps> = ({ expansions, compact = false }) => {
  const { tokens } = useTheme();
  const area = expansions * 67;

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold select-none"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
          boxShadow: `0 0 10px ${tokens.neonPrimary}33`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: tokens.neonPrimary }}
        />
        <span style={{ color: tokens.textSecondary }}>Domain:</span>
        <span style={{ color: tokens.neonPrimary }}>{expansions} EXP</span>
        <span style={{ color: tokens.textMuted }}>•</span>
        <span style={{ color: tokens.text }}>+{area} sq area</span>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border select-none"
      style={{
        backgroundColor: tokens.cardBg,
        borderColor: tokens.cardBorder,
        boxShadow: tokens.neonBoxShadow,
      }}
    >
      {/* Anime Void Accent Ring */}
      <div
        className="absolute -right-12 -top-12 w-44 h-44 rounded-full opacity-15 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${tokens.neonPrimary} 0%, transparent 70%)`,
        }}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs uppercase tracking-[0.25em] font-extrabold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${tokens.neonPrimary}22`,
                color: tokens.neonPrimary,
                border: `1px solid ${tokens.neonPrimary}55`,
              }}
            >
              DOMAIN EXPANSION
            </span>
          </div>
          <h3
            className="text-2xl font-black mt-2 tracking-tight"
            style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
          >
            Infinite Neon Realm
          </h3>
          <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
            Each battle victory seals your power with +1 Expansion (+67 Domain Area).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="px-4 py-2.5 rounded-xl text-center border"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderColor: `${tokens.neonPrimary}44`,
            }}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: tokens.textMuted }}>
              Expansions
            </div>
            <div
              className="text-2xl font-black"
              style={{ color: tokens.neonPrimary, textShadow: tokens.neonTextShadow }}
            >
              {expansions}
            </div>
          </div>

          <div
            className="px-4 py-2.5 rounded-xl text-center border"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderColor: `${tokens.neonPrimary}44`,
            }}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: tokens.textMuted }}>
              Domain Area
            </div>
            <div
              className="text-2xl font-black"
              style={{ color: tokens.text }}
            >
              +{area} <span className="text-xs font-semibold text-pink-400">m²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
