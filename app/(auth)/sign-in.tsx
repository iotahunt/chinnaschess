import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { NeonInput } from '@/components/NeonInput';
import { NeonButton } from '@/components/NeonButton';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SignInScreen() {
  const { tokens } = useTheme();
  const { signIn, signInAsGuest } = useAuth();
  const { replace } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to sign in.');
    } else {
      replace('/lobby');
    }
  };

  const handleGuestEntry = () => {
    signInAsGuest();
    replace('/lobby');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md p-8 rounded-3xl border select-none relative overflow-hidden"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
          boxShadow: tokens.neonBoxShadow,
        }}
      >
        {/* Glow ambient circle */}
        <div
          className="absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tokens.neonPrimary} 0%, transparent 70%)` }}
        />

        <div className="text-center mb-6">
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
          >
            Enter The Domain
          </h2>
          <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
            Sign in with your email to claim your domain expansions.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div
            className="mb-4 p-3 rounded-xl border text-xs"
            style={{
              backgroundColor: 'rgba(255,170,0,0.1)',
              borderColor: 'rgba(255,170,0,0.4)',
              color: '#ffb300',
            }}
          >
            <strong>Note:</strong> Supabase credentials not configured in <code className="px-1 py-0.5 rounded bg-black/40">.env.local</code>. Instant Demo sign-in is enabled!
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NeonInput
            label="Email Address"
            type="email"
            placeholder="grandmaster@chess.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <NeonInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          {errorMsg && (
            <div className="text-xs font-semibold text-rose-500 bg-rose-950/30 p-2.5 rounded-xl border border-rose-800/50">
              {errorMsg}
            </div>
          )}

          <NeonButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
            icon={<LogIn className="w-4 h-4" />}
          >
            Sign In
          </NeonButton>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: tokens.cardBorder }} />
          </div>
          <span
            className="relative px-3 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: tokens.bg, color: tokens.textMuted }}
          >
            or
          </span>
        </div>

        <NeonButton
          type="button"
          variant="secondary"
          size="md"
          className="w-full"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={handleGuestEntry}
        >
          Quick Guest Access
        </NeonButton>

        <div className="mt-6 text-center text-xs" style={{ color: tokens.textSecondary }}>
          Don't have an account?{' '}
          <Link
            href="/sign-up"
            className="font-bold underline cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: tokens.neonPrimary }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
