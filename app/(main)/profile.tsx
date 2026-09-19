import React, { useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { DomainBanner } from '@/components/DomainBanner';
import { NeonButton } from '@/components/NeonButton';
import { User, Shield, Sun, Moon, LogOut, Award, Zap, Sword, ChevronRight } from 'lucide-react';

export default function ProfileScreen() {
  const { tokens, theme, toggleTheme } = useTheme();
  const { user, profile, refreshProfile, signOut, signInAsGuest } = useAuth();
  const { push } = useRouter();

  useEffect(() => {
    if (!user) {
      signInAsGuest();
    } else {
      refreshProfile();
    }
  }, [user, refreshProfile, signInAsGuest]);

  const domainCount = profile?.domain_expansions ?? 0;
  const domainArea = domainCount * 67;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center border mb-3 shadow-xl"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.neonPrimary,
            boxShadow: tokens.neonBoxShadow,
          }}
        >
          <User className="w-8 h-8" style={{ color: tokens.neonPrimary }} />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-black tracking-tight"
          style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
        >
          Grandmaster Profile
        </h2>
        <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: tokens.textSecondary }}>
          {user?.email || 'guest@chinna.chess'}
        </p>
      </div>

      {/* Main Domain Expansion Card */}
      <div className="w-full mb-6">
        <DomainBanner expansions={domainCount} />
      </div>

      {/* Detailed Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full mb-6">
        <div
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Award className="w-5 h-5 mx-auto mb-1.5" style={{ color: tokens.neonPrimary }} />
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Domain Expansions
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: tokens.neonPrimary }}>
            {domainCount}
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Shield className="w-5 h-5 mx-auto mb-1.5" style={{ color: tokens.textSecondary }} />
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Total Domain Area
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: tokens.text }}>
            +{domainArea} <span className="text-xs font-normal text-pink-400">m²</span>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border text-center col-span-2 sm:col-span-1"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Zap className="w-5 h-5 mx-auto mb-1.5 text-amber-400" />
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Aura Tier
          </div>
          <div className="text-lg font-black mt-1 text-amber-400">
            {domainCount >= 10 ? 'Special Grade' : domainCount >= 3 ? 'Grade 1' : 'Grade 2 Sorcerer'}
          </div>
        </div>
      </div>

      {/* Settings / Preferences Card */}
      <div
        className="w-full rounded-2xl p-6 border mb-6"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
        }}
      >
        <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4" style={{ color: tokens.textSecondary }}>
          System Preferences
        </h3>

        {/* Theme Toggle row */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: tokens.cardBorder }}>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border"
              style={{ borderColor: tokens.cardBorder, color: tokens.neonPrimary }}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: tokens.text }}>
                Theme Appearance
              </div>
              <div className="text-xs" style={{ color: tokens.textMuted }}>
                {theme === 'dark'
                  ? 'Dark void with Neon Baby Pink glow'
                  : 'Pastel beige with Neon Red glow'}
              </div>
            </div>
          </div>

          <NeonButton
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            icon={theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </NeonButton>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <NeonButton
          variant="primary"
          size="md"
          className="w-full sm:flex-1"
          onClick={() => push('/lobby')}
          icon={<Sword className="w-4 h-4" />}
        >
          Enter Battle Lobby
        </NeonButton>

        <NeonButton
          variant="danger"
          size="md"
          className="w-full sm:flex-1"
          onClick={async () => {
            await signOut();
            push('/');
          }}
          icon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </NeonButton>
      </div>
    </div>
  );
}
