import React from 'react';
import { ThemeProvider, useTheme } from '../lib/theme';
import { AuthProvider, useAuth } from '../lib/auth';
import { RouterProvider, useRouter, usePathname, Link } from '../lib/router';
import { Sun, Moon, Shield, User as UserIcon, Sword, LogOut } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

const Header: React.FC = () => {
  const { tokens, theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const { push } = useRouter();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors select-none"
      style={{
        backgroundColor: `${tokens.bg}dd`,
        borderColor: tokens.cardBorder,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
            style={{
              backgroundColor: tokens.cardBg,
              borderColor: tokens.neonPrimary,
              boxShadow: tokens.neonBoxShadow,
            }}
          >
            <Sword className="w-5 h-5" style={{ color: tokens.neonPrimary }} />
          </div>
          <div>
            <h1
              className="text-lg font-black tracking-tight leading-none"
              style={{
                color: tokens.text,
                fontFamily: "'Cinzel', 'Outfit', sans-serif",
                textShadow: tokens.neonTextShadow,
              }}
            >
              Chinna's Chess
            </h1>
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-70" style={{ color: tokens.neonPrimary }}>
              Neon Domain Battle
            </div>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!isSupabaseConfigured && (
            <div
              title="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local for remote multiplayer sync"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: 'rgba(255,170,0,0.12)',
                borderColor: 'rgba(255,170,0,0.4)',
                color: '#ffb300',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo / Local Mode
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Lobby Quick Link */}
              <button
                onClick={() => push('/lobby')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  pathname === '/lobby' ? 'scale-105' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: pathname === '/lobby' ? `${tokens.neonPrimary}22` : 'transparent',
                  borderColor: pathname === '/lobby' ? tokens.neonPrimary : tokens.cardBorder,
                  color: tokens.text,
                }}
              >
                Lobby
              </button>

              {/* Profile Link with Domain Expansions */}
              <button
                onClick={() => push('/profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                style={{
                  backgroundColor: tokens.cardBg,
                  borderColor: pathname === '/profile' ? tokens.neonPrimary : tokens.cardBorder,
                  boxShadow: pathname === '/profile' ? `0 0 10px ${tokens.neonPrimary}44` : 'none',
                }}
              >
                <Shield className="w-3.5 h-3.5" style={{ color: tokens.neonPrimary }} />
                <span className="text-xs font-bold hidden sm:inline" style={{ color: tokens.text }}>
                  {profile?.domain_expansions ?? 0} Exp
                </span>
              </button>

              {/* Sign Out */}
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-2 rounded-lg border text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                style={{ borderColor: tokens.cardBorder }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => push('/sign-in')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                style={{ color: tokens.textSecondary }}
              >
                Sign In
              </button>
              <button
                onClick={() => push('/sign-up')}
                className="px-3 py-1.5 text-xs font-extrabold rounded-lg border transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: tokens.neonPrimary,
                  color: tokens.mode === 'dark' ? '#09070f' : '#ffffff',
                  borderColor: tokens.neonPrimary,
                  boxShadow: `0 0 10px ${tokens.neonPrimary}55`,
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl border transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: tokens.cardBg,
              borderColor: tokens.cardBorder,
              boxShadow: `0 0 10px ${tokens.neonPrimary}33`,
              color: tokens.neonPrimary,
            }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
