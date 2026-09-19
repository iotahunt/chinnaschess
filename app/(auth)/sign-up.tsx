import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { NeonInput } from '@/components/NeonInput';
import { NeonButton } from '@/components/NeonButton';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

export default function SignUpScreen() {
  const { tokens } = useTheme();
  const { signUp } = useAuth();
  const { replace } = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please provide both an email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName.trim() || undefined);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to create your sorcerer account.');
    } else {
      replace('/lobby');
    }
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
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tokens.neonPrimary} 0%, transparent 70%)` }}
        />

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
            Firebase Profile Protection
          </div>

          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
          >
            Forge Your Domain
          </h2>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: tokens.textSecondary }}>
            Create an authenticated profile to record your Domain Expansions, square meter area, and aura rank!
          </p>
        </div>

        {/* Domain Benefit Callout */}
        <div
          className="mb-5 p-3 rounded-2xl border flex items-center gap-3 text-xs"
          style={{
            backgroundColor: `${tokens.neonPrimary}08`,
            borderColor: `${tokens.neonPrimary}33`,
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${tokens.neonPrimary}22`,
              borderColor: tokens.neonPrimary,
              color: tokens.neonPrimary,
            }}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div className="leading-snug">
            <span className="font-bold" style={{ color: tokens.text }}>
              Domain Expansion Record:
            </span>
            <span className="block text-[11px] opacity-80" style={{ color: tokens.textSecondary }}>
              Every checkmate victory expands your domain by +67 m² in Cloud Firestore!
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 text-xs font-semibold text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NeonInput
            label="Sorcerer Name / Title"
            type="text"
            placeholder="e.g. Chinna Grandmaster"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            icon={<User className="w-4 h-4" />}
            autoComplete="name"
          />

          <NeonInput
            label="Email Address"
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
              label="Create Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
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

          <NeonInput
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />

          <NeonButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Register Sorcerer Profile
          </NeonButton>
        </form>

        <div className="mt-6 text-center text-xs" style={{ color: tokens.textSecondary }}>
          Already registered?{' '}
          <Link
            href="/sign-in"
            className="font-black underline cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: tokens.neonPrimary }}
          >
            Sign In with Password
          </Link>
        </div>
      </div>
    </div>
  );
}
