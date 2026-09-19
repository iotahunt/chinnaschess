import React from 'react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { NeonButton } from '../components/NeonButton';
import { DomainBanner } from '../components/DomainBanner';
import { Sword, Users, Zap, ShieldAlert, Play, Sparkles, Award } from 'lucide-react';

export default function HomeScreen() {
  const { tokens } = useTheme();
  const { user, profile, signInAsGuest } = useAuth();
  const { push } = useRouter();

  const handleStartPlaying = () => {
    if (user) {
      push('/lobby');
    } else {
      signInAsGuest('Chinna Grandmaster');
      push('/lobby');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full">
      {/* Hero Section */}
      <div className="text-center flex flex-col items-center max-w-2xl mx-auto mb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase mb-6"
          style={{
            backgroundColor: `${tokens.neonPrimary}15`,
            borderColor: `${tokens.neonPrimary}55`,
            color: tokens.neonPrimary,
            boxShadow: `0 0 12px ${tokens.neonPrimary}33`,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          JUJUTSU AURA CHESS BATTLE ENGINE
        </div>

        <h1
          className="text-4xl sm:text-6xl font-black tracking-tight leading-tight"
          style={{
            color: tokens.text,
            fontFamily: "'Cinzel', 'Outfit', sans-serif",
            textShadow: tokens.neonTextShadow,
          }}
        >
          Chinna's Chess
        </h1>

        <p className="text-base sm:text-lg mt-4 max-w-xl font-normal leading-relaxed" style={{ color: tokens.textSecondary }}>
          Wield ancient grandmaster strategy powered by modern aura dynamics. Capture enemy pieces to surge with aura points, defeat the adversary, and expand your neon domain by <span className="font-bold text-pink-400">+67 area</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 w-full max-w-md">
          {user ? (
            <>
              <NeonButton
                variant="primary"
                size="lg"
                glowPulse
                className="w-full sm:flex-1"
                icon={<Play className="w-5 h-5 fill-current" />}
                onClick={() => push('/lobby')}
              >
                Enter Battle Lobby
              </NeonButton>
              <NeonButton
                variant="secondary"
                size="lg"
                className="w-full sm:flex-1"
                onClick={() => push('/profile')}
              >
                My Domain Profile
              </NeonButton>
            </>
          ) : (
            <>
              <NeonButton
                variant="primary"
                size="lg"
                glowPulse
                className="w-full sm:flex-1"
                icon={<Sparkles className="w-5 h-5 fill-current" />}
                onClick={() => push('/sign-up')}
              >
                Sign Up & Save Domain
              </NeonButton>
              <NeonButton
                variant="secondary"
                size="lg"
                className="w-full sm:flex-1"
                icon={<Play className="w-5 h-5" />}
                onClick={handleStartPlaying}
              >
                Quick Guest Play
              </NeonButton>
            </>
          )}
        </div>
      </div>

      {/* User Domain Banner if authenticated */}
      {user && profile && (
        <div className="w-full max-w-3xl mb-10">
          <DomainBanner expansions={profile.domain_expansions} />
        </div>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl">
        <div
          className="p-6 rounded-2xl border transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.cardBorder,
            boxShadow: `0 0 14px ${tokens.neonPrimary}15`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border mb-4"
            style={{
              backgroundColor: `${tokens.neonPrimary}15`,
              borderColor: tokens.neonPrimary,
              color: tokens.neonPrimary,
            }}
          >
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black" style={{ color: tokens.text }}>
            Play With Friend
          </h3>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: tokens.textSecondary }}>
            Instantly create a 6-character room code or join an opponent's room for live synchronization via Supabase Realtime.
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.cardBorder,
            boxShadow: `0 0 14px ${tokens.neonPrimary}15`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border mb-4"
            style={{
              backgroundColor: `${tokens.neonPrimary}15`,
              borderColor: tokens.neonPrimary,
              color: tokens.neonPrimary,
            }}
          >
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black" style={{ color: tokens.text }}>
            Aura Dynamics
          </h3>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: tokens.textSecondary }}>
            Every capture triggers full-screen electric shockwaves: Queen (+900), Rook (+500), Bishop/Knight (+300), Pawn (+100).
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.cardBorder,
            boxShadow: `0 0 14px ${tokens.neonPrimary}15`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border mb-4"
            style={{
              backgroundColor: `${tokens.neonPrimary}15`,
              borderColor: tokens.neonPrimary,
              color: tokens.neonPrimary,
            }}
          >
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black" style={{ color: tokens.text }}>
            Domain Expansion
          </h3>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: tokens.textSecondary }}>
            Securing checkmate seals your victory with a +1 Domain Expansion milestone and expands your territory by +67 m².
          </p>
        </div>
      </div>
    </div>
  );
}
