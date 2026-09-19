import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { NeonInput } from '@/components/NeonInput';
import { NeonButton } from '@/components/NeonButton';
import { Mail, Lock, LogIn, Sparkles, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

export default function SignInScreen() {
  const { tokens } = useTheme();
  const { signIn, signInAsGuest } = useAuth();
  const { replace } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Authentication failed. Please verify your credentials.');
    } else {
      replace('/lobby');
    }
  };

  const handleGuestEntry = async () => {
    setLoading(true);
    await signInAsGuest();
    setLoading(false);
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
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tokens.neonPrimary} 0%, transparent 70%)` }}
        />

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3 border"
            style={{
              backgroundColor: `${tokens.neonPrimary}15`,
              borderColor: tokens.neonPrimary,
              color: tokens.neonPrimary,
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Firebase Auth Secured
          </div>

          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
          >
            Enter The Domain
          </h2>
          <p className="text-xs mt-1.5" style={{ color: tokens.textSecondary }}>
            Sign in to unlock your persistent domain expansions and battle history.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 text-xs font-semibold text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NeonInput
            label="Sorcerer Email Address"
            type="email"
            placeholder="grandmaster@chinna.chess"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <div className="relative">
            <NeonInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-xs opacity-60 hover:opacity-100 transition-opacity p-1 cursor-pointer"
              style={{ color: tokens.text }}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <NeonButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
            icon={<LogIn className="w-4 h-4" />}
          >
            Sign In with Password
          </NeonButton>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: tokens.cardBorder }} />
          </div>
          <span
            className="relative px-3 text-[11px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: tokens.cardBg, color: tokens.textMuted }}
          >
            or play instantly
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
          Quick Guest Battle (No Password)
        </NeonButton>

        <div className="mt-6 text-center text-xs" style={{ color: tokens.textSecondary }}>
          Don't have a sorcerer account?{' '}
          <Link
            href="/sign-up"
            className="font-black underline cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: tokens.neonPrimary }}
          >
            Register Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
