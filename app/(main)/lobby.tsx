import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { NeonButton } from '@/components/NeonButton';
import { NeonInput } from '@/components/NeonInput';
import { db, GameRecord } from '@/lib/supabase';
import { Users, Plus, Hash, Copy, Check, Play, Zap, ArrowRight, Link2, Clipboard, Sparkles } from 'lucide-react';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function cleanRoomInput(raw: string): string {
  if (!raw) return '';
  // If user pasted a full URL or link, extract the game id or code
  if (raw.includes('/game/')) {
    const match = raw.match(/\/game\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  if (raw.includes('code=')) {
    const match = raw.match(/code=([a-zA-Z0-9]+)/i);
    if (match) return match[1].toUpperCase();
  }
  if (raw.includes('join=')) {
    const match = raw.match(/join=([a-zA-Z0-9]+)/i);
    if (match) return match[1].toUpperCase();
  }
  // Strip spaces, symbols, hashtags
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase().slice(0, 36);
}

export default function LobbyScreen() {
  const { tokens } = useTheme();
  const { user, signInAsGuest } = useAuth();
  const { push, replace } = useRouter();

  const [createdGame, setCreatedGame] = useState<GameRecord | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Protect route & auto-populate code from URL
  useEffect(() => {
    if (!user) {
      signInAsGuest();
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code') || urlParams.get('join');
      if (codeFromUrl) {
        setJoinCode(cleanRoomInput(codeFromUrl));
      }
    }
  }, [user, signInAsGuest]);

  // If waiting in created game, subscribe to detect when opponent joins!
  useEffect(() => {
    if (!createdGame) return;

    const unsubscribe = db.subscribeToGame(createdGame.id, (updatedGame) => {
      if (updatedGame.black_user_id && updatedGame.status === 'active') {
        // Opponent joined! Navigate immediately
        push(`/game/${updatedGame.id}`);
      }
    });

    return () => unsubscribe();
  }, [createdGame, push]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setErrorMsg('');
    setLoadingCreate(true);

    try {
      const code = generateRoomCode();
      const newGame = await db.createGame({
        roomCode: code,
        whiteUserId: user.id,
        startingFen: STARTING_FEN,
      });
      setCreatedGame(newGame);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to create room.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    setErrorMsg('');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = cleanRoomInput(text);
          setJoinCode(cleaned);
          return;
        }
      }
      setErrorMsg('Clipboard access not allowed. Please paste directly into the box.');
    } catch {
      setErrorMsg('Please tap or click inside the box and paste.');
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');

    const sanitized = cleanRoomInput(joinCode);
    if (!sanitized || sanitized.length < 5) {
      setErrorMsg('Room code must be at least 6 characters.');
      return;
    }

    setLoadingJoin(true);
    try {
      // 1. Try finding by room code
      let game = await db.findGameByRoomCode(sanitized);

      // 2. Fallback: try by direct Game ID (if they pasted a full link/game_ ID)
      if (!game) {
        game = await db.getGame(sanitized);
      }

      if (!game) {
        setErrorMsg('Room not found. Check the code and try again.');
        setLoadingJoin(false);
        return;
      }

      if (game.status === 'finished') {
        setErrorMsg('This game has already finished.');
        setLoadingJoin(false);
        return;
      }

      // If already the white player, enter directly
      if (game.white_user_id === user.id) {
        push(`/game/${game.id}`);
        return;
      }

      if (game.black_user_id && game.black_user_id !== user.id) {
        setErrorMsg('This room already has two players.');
        setLoadingJoin(false);
        return;
      }

      // Join as black player
      const joined = await db.joinGame(game.id, user.id);
      if (joined) {
        push(`/game/${joined.id}`);
      } else {
        setErrorMsg('Could not join room.');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to join room.');
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdGame) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(createdGame.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (!createdGame || typeof window === 'undefined') return;
    const url = `${window.location.origin}/game/${createdGame.id}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStartSoloPassAndPlay = async () => {
    if (!user) return;
    setLoadingCreate(true);
    try {
      const code = generateRoomCode();
      const soloGame = await db.createGame({
        roomCode: code,
        whiteUserId: user.id,
        startingFen: STARTING_FEN,
      });
      // Immediately set black to same or guest so it starts active
      await db.joinGame(soloGame.id, user.id + '_black');
      push(`/game/${soloGame.id}?mode=local`);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to start game.');
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
          style={{
            backgroundColor: `${tokens.neonPrimary}22`,
            color: tokens.neonPrimary,
            border: `1px solid ${tokens.neonPrimary}55`,
          }}
        >
          <Users className="w-3.5 h-3.5" />
          MULTPLAYER MATCHMAKING
        </div>
        <h2
          className="text-3xl sm:text-4xl font-black tracking-tight"
          style={{ color: tokens.text, fontFamily: "'Cinzel', 'Outfit', sans-serif" }}
        >
          Play With Friend
        </h2>
        <p className="text-xs sm:text-sm mt-1" style={{ color: tokens.textSecondary }}>
          Create a room to share your 6-character code or enter an opponent's code.
        </p>
      </div>

      {errorMsg && (
        <div className="w-full max-w-md mb-6 p-3 rounded-xl border text-xs font-semibold text-rose-500 bg-rose-950/30 border-rose-800/50 text-center">
          {errorMsg}
        </div>
      )}

      {/* Waiting Room Modal if game created */}
      {createdGame ? (
        <div
          className="w-full max-w-md p-8 rounded-3xl border text-center relative overflow-hidden animate-scaleUp"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.neonPrimary,
            boxShadow: tokens.neonGlowStrong,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-pulse"
            style={{ backgroundColor: `${tokens.neonPrimary}22`, color: tokens.neonPrimary }}
          >
            <Zap className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black" style={{ color: tokens.text }}>
            Room Created!
          </h3>
          <p className="text-xs mt-1" style={{ color: tokens.textSecondary }}>
            Share this 6-character code with your friend:
          </p>

          <div
            className="my-4 p-4 rounded-2xl border flex items-center justify-between gap-3 select-all"
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderColor: tokens.neonPrimary,
            }}
          >
            <span
              className="text-3xl sm:text-4xl font-black tracking-widest font-mono"
              style={{ color: tokens.neonPrimary, textShadow: tokens.neonTextShadow }}
            >
              {createdGame.room_code}
            </span>

            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: tokens.cardBg,
                borderColor: tokens.cardBorder,
                color: tokens.text,
              }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{
                backgroundColor: `${tokens.neonPrimary}15`,
                borderColor: tokens.neonPrimary,
                color: tokens.neonPrimary,
              }}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Copy Direct Invite Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-wider mb-6 animate-pulse" style={{ color: tokens.textSecondary }}>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Waiting for opponent to join…
          </div>

          <div className="flex flex-col gap-3">
            <NeonButton
              variant="primary"
              size="md"
              onClick={() => push(`/game/${createdGame.id}`)}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Enter Board Now
            </NeonButton>
            <NeonButton
              variant="ghost"
              size="sm"
              onClick={() => setCreatedGame(null)}
            >
              Cancel Room
            </NeonButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Card 1: Create Random Code */}
          <div
            className="p-6 rounded-3xl border flex flex-col justify-between"
            style={{
              backgroundColor: tokens.cardBg,
              borderColor: tokens.cardBorder,
              boxShadow: tokens.neonBoxShadow,
            }}
          >
            <div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border mb-4"
                style={{
                  backgroundColor: `${tokens.neonPrimary}22`,
                  borderColor: tokens.neonPrimary,
                  color: tokens.neonPrimary,
                }}
              >
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black" style={{ color: tokens.text }}>
                Create Game
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: tokens.textSecondary }}>
                Generates a fresh 6-character room code. You'll play as White and wait for your friend to connect.
              </p>
            </div>

            <div className="mt-8">
              <NeonButton
                variant="primary"
                size="lg"
                loading={loadingCreate}
                className="w-full"
                icon={<Zap className="w-4 h-4" />}
                onClick={handleCreateRoom}
              >
                Create Random Code
              </NeonButton>
            </div>
          </div>

          {/* Card 2: Join with Code */}
          <div
            className="p-6 rounded-3xl border flex flex-col justify-between"
            style={{
              backgroundColor: tokens.cardBg,
              borderColor: tokens.cardBorder,
              boxShadow: tokens.neonBoxShadow,
            }}
          >
            <div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border mb-4"
                style={{
                  backgroundColor: `${tokens.neonPrimary}22`,
                  borderColor: tokens.neonPrimary,
                  color: tokens.neonPrimary,
                }}
              >
                <Hash className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black" style={{ color: tokens.text }}>
                Join with Code
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: tokens.textSecondary }}>
                Got an invite code? Enter the 6-character room code to join as Black.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <NeonInput
                    placeholder="e.g. 7X9K2B"
                    value={joinCode}
                    onChange={(e) => setJoinCode(cleanRoomInput(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text');
                      if (pasted) {
                        setJoinCode(cleanRoomInput(pasted));
                      }
                    }}
                    maxLength={36}
                    className="text-center tracking-widest text-lg font-mono uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-3.5 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: `${tokens.neonSecondary}22`,
                    borderColor: tokens.neonSecondary,
                    color: tokens.neonSecondary,
                  }}
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste</span>
                </button>
              </div>

              <NeonButton
                type="submit"
                variant="secondary"
                size="lg"
                loading={loadingJoin}
                disabled={cleanRoomInput(joinCode).length < 5}
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Join Match
              </NeonButton>
            </form>
          </div>
        </div>
      )}

      {/* Quick Play & Pass and Play section for instant action */}
      {!createdGame && (
        <div className="mt-8 text-center">
          <button
            onClick={handleStartSoloPassAndPlay}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderColor: tokens.cardBorder,
              color: tokens.textSecondary,
            }}
          >
            <Play className="w-3.5 h-3.5 text-pink-400" />
            <span>Practice / Pass-and-Play on this device</span>
          </button>
        </div>
      )}
    </div>
  );
}
