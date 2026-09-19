import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { NeonInput } from '@/components/NeonInput';
import { NeonButton } from '@/components/NeonButton';
import { Mail, Lock, UserPlus, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SignUpScreen() {
  const { tokens } = useTheme();
  const { signUp } = useAuth();
  const { replace } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error, needsVerification } = await signUp(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to create account.');
    } else if (needsVerification) {
      setVerificationPending(true);
    } else {
      replace('/lobby');
    }
  };

  if (verificationPending) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md p-8 rounded-3xl border text-center select-none"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.neonPrimary,
            boxShadow: tokens.neonBoxShadow,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: `${tokens.neonPrimary}22`, color: tokens.neonPrimary }}
          >
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2
            className="text-2xl font-black tracking-tight"
            style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
          >
            Verify Your Email
          </h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: tokens.textSecondary }}>
            We have sent a verification link to <strong className="text-pink-400">{email}</strong>. Please check your inbox and click the confirmation link to activate your realm.
          </p>

          <NeonButton
            variant="primary"
            size="md"
            className="w-full mt-6"
            onClick={() => replace('/sign-in')}
          >
            Return to Sign In
          </NeonButton>
        </div>
      </div>
    );
  }

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
        <div className="text-center mb-6">
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
          >
            Forge Your Domain
          </h2>
          <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
            Create an account to begin ranking expansions in Chinna's Chess.
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
            <strong>Note:</strong> Supabase credentials not configured in <code className="px-1 py-0.5 rounded bg-black/40">.env.local</code>. Instant Demo sign-up is enabled!
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
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <NeonInput
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Account
          </NeonButton>
        </form>

        <div className="mt-6 text-center text-xs" style={{ color: tokens.textSecondary }}>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-bold underline cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: tokens.neonPrimary }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
