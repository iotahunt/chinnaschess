import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { DomainBanner } from '@/components/DomainBanner';
import { NeonButton } from '@/components/NeonButton';
import { NeonInput } from '@/components/NeonInput';
import {
  User,
  Shield,
  Sun,
  Moon,
  LogOut,
  Award,
  Zap,
  Sword,
  Edit2,
  Check,
  X,
  History,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  UserPlus,
  Trophy,
} from 'lucide-react';

export default function ProfileScreen() {
  const { tokens, theme, toggleTheme } = useTheme();
  const { user, profile, refreshProfile, signOut, updateDisplayName } = useAuth();
  const { push } = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState('');

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (user?.displayName) {
      setNameInput(user.displayName);
    }
  }, [user?.displayName]);

  const domainCount = profile?.domain_expansions ?? 0;
  const domainArea = profile?.domain_area ?? domainCount * 67;
  const auraGrade = profile?.aura_grade || (domainCount >= 15 ? 'Special Grade Jujutsu Master' : domainCount >= 8 ? 'Grade 1 Jujutsu Sorcerer' : domainCount >= 4 ? 'Grade 2 Jujutsu Sorcerer' : domainCount >= 1 ? 'Grade 3 Sorcerer' : 'Grade 4 Novice');
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const draws = profile?.draws ?? 0;
  const totalGames = profile?.games_played ?? (wins + losses + draws);
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const recentDomains = profile?.recent_domains || [];

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    setNameFeedback('');
    const { error } = await updateDisplayName(nameInput.trim());
    setSavingName(false);
    if (error) {
      setNameFeedback(error.message);
    } else {
      setEditingName(false);
      refreshProfile();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
      {/* Guest Mode Warning Banner if not logged in with real password account */}
      {user?.isGuest && (
        <div
          className="w-full mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 select-none animate-fadeIn"
          style={{
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderColor: 'rgba(255, 170, 0, 0.4)',
            color: '#ffb300',
          }}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-white block sm:inline">Guest Session Active: </span>
              Your domain expansions are currently on a temporary guest profile. Register with an email and password to permanently safeguard your territory!
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NeonButton
              variant="primary"
              size="sm"
              onClick={() => push('/sign-up')}
              icon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Sign Up
            </NeonButton>
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => push('/sign-in')}
              icon={<LogIn className="w-3.5 h-3.5" />}
            >
              Sign In
            </NeonButton>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="text-center mb-6 w-full flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center border mb-3 shadow-xl relative"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.neonPrimary,
            boxShadow: tokens.neonBoxShadow,
          }}
        >
          <User className="w-10 h-10" style={{ color: tokens.neonPrimary }} />
          <div
            className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow"
            style={{
              backgroundColor: tokens.bg,
              borderColor: tokens.neonPrimary,
              color: tokens.neonPrimary,
            }}
          >
            {user?.isGuest ? 'Guest' : 'Verified'}
          </div>
        </div>

        {/* Display Name Editor */}
        {editingName ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Sorcerer Name"
              className="px-3 py-1.5 text-sm font-bold rounded-xl border outline-none font-mono"
              style={{
                backgroundColor: tokens.cardBg,
                borderColor: tokens.neonPrimary,
                color: tokens.text,
              }}
              autoFocus
            />
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="p-2 rounded-xl border text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer"
              title="Save Name"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="p-2 rounded-xl border text-rose-400 border-rose-500/50 hover:bg-rose-500/10 cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <h2
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
            >
              {profile?.display_name || user?.displayName || 'Sorcerer'}
            </h2>
            <button
              onClick={() => {
                setNameInput(profile?.display_name || user?.displayName || '');
                setEditingName(true);
              }}
              className="p-1.5 rounded-lg border opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ borderColor: tokens.cardBorder, color: tokens.textSecondary }}
              title="Edit Sorcerer Name"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {nameFeedback && (
          <p className="text-xs text-rose-400 mt-1 font-semibold">{nameFeedback}</p>
        )}

        <div className="flex items-center gap-2 mt-1 font-mono text-xs" style={{ color: tokens.textSecondary }}>
          <span>{user?.email || 'unregistered@chinna.chess'}</span>
          <span>•</span>
          <span className="flex items-center gap-1" style={{ color: tokens.neonPrimary }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Cloud Synced
          </span>
        </div>
      </div>

      {/* Main Domain Expansion Visual Banner */}
      <div className="w-full mb-6">
        <DomainBanner expansions={domainCount} />
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full mb-6">
        {/* Domain Expansions */}
        <div
          className="p-4 rounded-2xl border text-center relative overflow-hidden"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Award className="w-5 h-5 mx-auto mb-1.5" style={{ color: tokens.neonPrimary }} />
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Domain Expansions
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: tokens.neonPrimary }}>
            {domainCount}
          </div>
        </div>

        {/* Total Domain Area */}
        <div
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Shield className="w-5 h-5 mx-auto mb-1.5" style={{ color: tokens.neonPrimary }} />
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Domain Area Exp.
          </div>
          <div className="text-2xl font-black mt-1" style={{ color: tokens.text }}>
            +{domainArea} <span className="text-xs font-normal opacity-70">m²</span>
          </div>
        </div>

        {/* Aura Grade */}
        <div
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Zap className="w-5 h-5 mx-auto mb-1.5 text-amber-400" />
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Sorcerer Rank
          </div>
          <div className="text-sm font-black mt-2 text-amber-400 leading-tight">
            {auraGrade}
          </div>
        </div>

        {/* Battle Win Rate */}
        <div
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: tokens.cardBg, borderColor: tokens.cardBorder }}
        >
          <Trophy className="w-5 h-5 mx-auto mb-1.5 text-emerald-400" />
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Win Rate / Total
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-400">
            {winRate}% <span className="text-xs font-semibold opacity-60">({wins}W / {losses}L)</span>
          </div>
        </div>
      </div>

      {/* Domain Manifestation Battle History */}
      <div
        className="w-full rounded-2xl p-5 border mb-6"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" style={{ color: tokens.neonPrimary }} />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: tokens.textSecondary }}>
              Domain Expansion Battle Log
            </h3>
          </div>
          <span className="text-[11px] font-mono opacity-70" style={{ color: tokens.textSecondary }}>
            {recentDomains.length} recorded
          </span>
        </div>

        {recentDomains.length === 0 ? (
          <div className="py-6 text-center text-xs" style={{ color: tokens.textMuted }}>
            No domain expansions recorded yet. Achieve checkmate in the arena to manifest territory!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentDomains.map((record) => (
              <div
                key={record.id}
                className="px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: tokens.bg,
                  borderColor: tokens.cardBorder,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                      record.result === 'victory'
                        ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                        : record.result === 'draw'
                        ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                        : 'text-rose-400 border-rose-500/40 bg-rose-500/10'
                    }`}
                  >
                    {record.result}
                  </span>
                  <span className="font-semibold" style={{ color: tokens.text }}>
                    vs {record.opponent || 'Rival Sorcerer'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className="font-bold font-mono"
                    style={{
                      color: record.area_change > 0 ? tokens.neonPrimary : tokens.textMuted,
                    }}
                  >
                    {record.area_change > 0 ? `+${record.area_change} m²` : '0 m²'}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono hidden sm:inline" style={{ color: tokens.textSecondary }}>
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Preferences Card */}
      <div
        className="w-full rounded-2xl p-5 border mb-6"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
        }}
      >
        <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: tokens.textSecondary }}>
          Preferences
        </h3>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border"
              style={{ borderColor: tokens.cardBorder, color: tokens.neonPrimary }}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: tokens.text }}>
                Domain Realm Appearance
              </div>
              <div className="text-[11px]" style={{ color: tokens.textMuted }}>
                {theme === 'dark' ? 'Dark void with Neon Baby Pink' : 'Pastel beige with Neon Red'}
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

        {user?.isGuest ? (
          <NeonButton
            variant="secondary"
            size="md"
            className="w-full sm:flex-1"
            onClick={() => push('/sign-up')}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Register Profile with Password
          </NeonButton>
        ) : (
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
        )}
      </div>
    </div>
  );
}
