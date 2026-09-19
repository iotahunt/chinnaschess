import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from '@/lib/router';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { ChessEngine, MoveExecutionResult } from '@/lib/chess';
import { ChessBoard } from '@/components/ChessBoard';
import { AuraFlash, AuraFlashData } from '@/components/AuraFlash';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { NeonButton } from '@/components/NeonButton';
import { db, GameRecord } from '@/lib/supabase';
import { Square } from 'chess.js';
import { Copy, Check, RotateCcw, Flag, Users, Zap, Shield, Sparkles, Link2 } from 'lucide-react';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useTheme();
  const { user, signInAsGuest } = useAuth();
  const { push } = useRouter();

  const [game, setGame] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [auraFlash, setAuraFlash] = useState<AuraFlashData | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [gameOverModalOpen, setGameOverModalOpen] = useState(false);

  // Instantiated ChessEngine
  const engine = useMemo(() => new ChessEngine(), []);

  // Track previous FEN and Aura for change detection during realtime updates
  const prevFenRef = useRef<string>('');
  const prevWhiteAuraRef = useRef<number>(0);
  const prevBlackAuraRef = useRef<number>(0);

  // Auto assign guest user if arrived directly
  useEffect(() => {
    if (!user) {
      signInAsGuest();
    }
  }, [user, signInAsGuest]);

  // Determine user's player color
  const playerColor: 'w' | 'b' = useMemo(() => {
    if (!game || !user) return 'w';
    if (user.id === game.black_user_id) return 'b';
    return 'w';
  }, [game, user]);

  const isPlayerInGame = Boolean(
    user && game && (user.id === game.white_user_id || user.id === game.black_user_id)
  );

  // Check if it's local pass-and-play mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'local') {
        setIsLocalMode(true);
      }
    }
  }, []);

  // Initial Game Load
  useEffect(() => {
    if (!id) return;

    let mounted = true;
    async function loadGame() {
      setLoading(true);
      let data = await db.getGame(id);
      if (!mounted) return;
      if (data) {
        // Auto-join as Black player if slot is open and visitor is not White
        if (user && data.white_user_id !== user.id && !data.black_user_id) {
          const joined = await db.joinGame(data.id, user.id);
          if (joined) {
            data = joined;
          }
        }

        setGame(data);
        engine.load(data.fen);
        prevFenRef.current = data.fen;
        prevWhiteAuraRef.current = data.white_aura;
        prevBlackAuraRef.current = data.black_aura;

        if (data.status === 'finished') {
          setGameOverModalOpen(true);
        }
      }
      setLoading(false);
    }

    loadGame();
    return () => {
      mounted = false;
    };
  }, [id, engine, user]);

  // Realtime Subscription
  useEffect(() => {
    if (!id) return;

    const unsubscribe = db.subscribeToGame(id, (updatedGame) => {
      setGame((prev) => {
        // Only update if changes occurred
        if (!prev) return updatedGame;

        // Check if FEN changed from outside move
        if (updatedGame.fen !== prevFenRef.current) {
          engine.load(updatedGame.fen);
          prevFenRef.current = updatedGame.fen;
        }

        // Check for aura delta to trigger capture flash
        const whiteDiff = updatedGame.white_aura - prevWhiteAuraRef.current;
        const blackDiff = updatedGame.black_aura - prevBlackAuraRef.current;

        if (whiteDiff > 0) {
          const isMe = user?.id === updatedGame.white_user_id;
          setAuraFlash({
            id: 'flash_' + Date.now(),
            isPositive: isMe,
            delta: whiteDiff,
          });
        } else if (blackDiff > 0) {
          const isMe = user?.id === updatedGame.black_user_id;
          setAuraFlash({
            id: 'flash_' + Date.now(),
            isPositive: isMe,
            delta: blackDiff,
          });
        }

        prevWhiteAuraRef.current = updatedGame.white_aura;
        prevBlackAuraRef.current = updatedGame.black_aura;

        if (updatedGame.status === 'finished') {
          setGameOverModalOpen(true);
        }

        return updatedGame;
      });
    });

    return () => unsubscribe();
  }, [id, engine, user]);

  // Handling moves made by local player
  const handleMove = useCallback(
    async (result: MoveExecutionResult) => {
      if (!game || !user) return;

      const currentTurn = engine.getTurn(); // Turn AFTER the move
      const movedColor = currentTurn === 'w' ? 'b' : 'w';

      let newWhiteAura = game.white_aura;
      let newBlackAura = game.black_aura;

      // Aura computation: Capturer gains +aura, opponent loses -aura
      if (result.capturedPiece && result.auraDelta > 0) {
        if (movedColor === 'w') {
          newWhiteAura += result.auraDelta;
          newBlackAura -= result.auraDelta;
        } else {
          newBlackAura += result.auraDelta;
          newWhiteAura -= result.auraDelta;
        }

        // Trigger capture flash overlay for local player
        const isMyCapture = isLocalMode || movedColor === playerColor;
        setAuraFlash({
          id: 'flash_' + Date.now(),
          isPositive: isMyCapture,
          delta: result.auraDelta,
          pieceName: result.capturedPiece.toUpperCase(),
        });
      }

      // Check game over
      let nextStatus = game.status;
      let winnerId: string | null = null;

      if (result.isCheckmate) {
        nextStatus = 'finished';
        winnerId = movedColor === 'w' ? game.white_user_id : (game.black_user_id || 'guest_opponent');
        // Increment winner's domain expansions
        if (winnerId && !winnerId.includes('opponent')) {
          db.incrementDomainExpansion(winnerId).catch(console.error);
        }
        setGameOverModalOpen(true);
      } else if (result.isDraw) {
        nextStatus = 'finished';
        setGameOverModalOpen(true);
      }

      // Optimistic update
      const optimisticGame: GameRecord = {
        ...game,
        fen: result.newFen,
        white_aura: newWhiteAura,
        black_aura: newBlackAura,
        status: nextStatus,
        winner_id: winnerId,
      };
      setGame(optimisticGame);
      prevFenRef.current = result.newFen;
      prevWhiteAuraRef.current = newWhiteAura;
      prevBlackAuraRef.current = newBlackAura;

      // Sync to Supabase database
      await db.updateGameState({
        gameId: game.id,
        fen: result.newFen,
        whiteAura: newWhiteAura,
        blackAura: newBlackAura,
        status: nextStatus,
        winnerId: winnerId,
      });
    },
    [game, user, engine, isLocalMode, playerColor]
  );

  const handleCopyCode = () => {
    if (!game) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(game.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (!game || typeof window === 'undefined') return;
    const url = `${window.location.origin}/game/${game.id}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleResign = async () => {
    if (!game || !user || game.status === 'finished') return;
    const confirm = window.confirm('Are you sure you want to resign this match?');
    if (!confirm) return;

    const opponentId = playerColor === 'w' ? game.black_user_id : game.white_user_id;
    if (opponentId) {
      await db.incrementDomainExpansion(opponentId);
    }

    const updated = await db.updateGameState({
      gameId: game.id,
      fen: game.fen,
      whiteAura: game.white_aura,
      blackAura: game.black_aura,
      status: 'finished',
      winnerId: opponentId,
    });
    if (updated) {
      setGame(updated);
      setGameOverModalOpen(true);
    }
  };

  const handleRematch = async () => {
    if (!user) return;
    setGameOverModalOpen(false);
    // Create fresh game and navigate
    const newG = await db.createGame({
      roomCode: game?.room_code ? game.room_code + 'R' : 'RMATCH',
      whiteUserId: user.id,
      startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    });
    push(`/game/${newG.id}${isLocalMode ? '?mode=local' : ''}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: tokens.neonPrimary, borderTopColor: 'transparent' }}
          />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: tokens.textSecondary }}>
            Entering Neon Realm…
          </span>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black" style={{ color: tokens.text }}>
          Match Not Found
        </h2>
        <p className="text-xs mt-2 mb-6" style={{ color: tokens.textSecondary }}>
          This game room may have expired or was removed.
        </p>
        <NeonButton variant="primary" size="md" onClick={() => push('/lobby')}>
          Return to Lobby
        </NeonButton>
      </div>
    );
  }

  const gameState = engine.getState();
  const isFinished = game.status === 'finished';
  const isWaiting = game.status === 'waiting' && !game.black_user_id && !isLocalMode;
  const isWinner = isFinished && game.winner_id === user?.id;

  // In local mode, board orientation toggles or defaults to white
  const currentTurn = gameState.turn;
  const interactiveAllowed = !isFinished && (!isWaiting || isLocalMode);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 py-6 max-w-5xl mx-auto w-full">
      {/* Capture Flash Overlay */}
      <AuraFlash data={auraFlash} onDismiss={() => setAuraFlash(null)} />

      {/* Game Over Victory / Defeat Modal */}
      <GameOverOverlay
        isOpen={gameOverModalOpen}
        isWinner={isWinner}
        isDraw={gameState.isDraw}
        drawReason={gameState.drawReason}
        onPlayAgain={handleRematch}
        onReturnToLobby={() => push('/lobby')}
      />

      {/* Top Match Info Bar */}
      <div
        className="w-full max-w-[540px] mb-3 p-3.5 rounded-2xl border flex items-center justify-between gap-2 select-none shadow-lg"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
          boxShadow: `0 0 12px ${tokens.neonPrimary}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.textMuted }}>
            Room:
          </span>
          <span
            className="text-sm font-black font-mono tracking-widest px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: `${tokens.neonPrimary}15`,
              color: tokens.neonPrimary,
              border: `1px solid ${tokens.neonPrimary}44`,
            }}
          >
            {game.room_code}
          </span>
          <button
            onClick={handleCopyCode}
            title="Copy room code"
            className="p-1 rounded-lg border transition-all hover:scale-105 cursor-pointer text-xs flex items-center gap-1"
            style={{ borderColor: tokens.cardBorder, color: tokens.textSecondary }}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={handleCopyLink}
            title="Copy direct invite link"
            className="p-1 rounded-lg border transition-all hover:scale-105 cursor-pointer text-xs flex items-center gap-1"
            style={{ borderColor: tokens.cardBorder, color: tokens.textSecondary }}
          >
            {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Link2 className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isWaiting ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Waiting Opponent
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live Battle
            </span>
          )}

          {interactiveAllowed && !isFinished && (
            <button
              onClick={handleResign}
              title="Resign Match"
              className="p-1.5 rounded-lg border text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer ml-1"
              style={{ borderColor: tokens.cardBorder }}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Opponent Aura Bar (Top Player) */}
      <div
        className="w-full max-w-[540px] mb-2 px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs font-bold select-none"
        style={{
          backgroundColor: tokens.bgSecondary,
          borderColor: tokens.cardBorder,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border"
            style={{
              backgroundColor: playerColor === 'w' ? '#14111d' : '#ffffff',
              borderColor: tokens.cardBorder,
            }}
          />
          <span style={{ color: tokens.textSecondary }}>
            {playerColor === 'w' ? 'Black (Opponent)' : 'White (Opponent)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span style={{ color: tokens.textMuted }}>Aura:</span>
          <span
            className="font-black text-sm"
            style={{
              color: (playerColor === 'w' ? game.black_aura : game.white_aura) >= 0 ? tokens.auraGreen : tokens.auraRed,
            }}
          >
            {(playerColor === 'w' ? game.black_aura : game.white_aura) > 0 ? '+' : ''}
            {playerColor === 'w' ? game.black_aura : game.white_aura}
          </span>
        </div>
      </div>

      {/* The Central Interactive Chessboard */}
      <div className="w-full my-1">
        <ChessBoard
          engine={engine}
          playerColor={isLocalMode ? currentTurn : playerColor}
          interactive={interactiveAllowed}
          onMove={handleMove}
          lastMove={lastMove}
        />
      </div>

      {/* Your Aura Bar (Bottom Player) */}
      <div
        className="w-full max-w-[540px] mt-2 px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs font-bold select-none shadow-md"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.neonPrimary,
          boxShadow: `0 0 10px ${tokens.neonPrimary}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border"
            style={{
              backgroundColor: playerColor === 'w' ? '#ffffff' : '#14111d',
              borderColor: tokens.neonPrimary,
            }}
          />
          <span style={{ color: tokens.text }}>
            {playerColor === 'w' ? 'White (You)' : 'Black (You)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: tokens.neonPrimary }} />
          <span style={{ color: tokens.textMuted }}>Your Aura:</span>
          <span
            className="font-black text-sm"
            style={{
              color: (playerColor === 'w' ? game.white_aura : game.black_aura) >= 0 ? tokens.auraGreen : tokens.auraRed,
              textShadow: (playerColor === 'w' ? game.white_aura : game.black_aura) > 0 ? tokens.neonTextShadow : undefined,
            }}
          >
            {(playerColor === 'w' ? game.white_aura : game.black_aura) > 0 ? '+' : ''}
            {playerColor === 'w' ? game.white_aura : game.black_aura}
          </span>
        </div>
      </div>

      {/* Waiting Opponent Helper Notice */}
      {isWaiting && (
        <div
          className="w-full max-w-[540px] mt-4 p-5 rounded-2xl border text-center select-none"
          style={{
            backgroundColor: `${tokens.neonPrimary}10`,
            borderColor: tokens.neonPrimary,
          }}
        >
          <div className="text-xs font-bold tracking-wider mb-2" style={{ color: tokens.text }}>
            Waiting for Player 2 to join with room code:
          </div>
          <div
            className="inline-block text-3xl font-black font-mono tracking-widest px-5 py-2 rounded-xl border select-all"
            style={{
              backgroundColor: tokens.bg,
              color: tokens.neonPrimary,
              borderColor: tokens.neonPrimary,
              boxShadow: tokens.neonBoxShadow,
            }}
          >
            {game.room_code}
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: tokens.cardBg,
                borderColor: tokens.cardBorder,
                color: tokens.text,
              }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: `${tokens.neonPrimary}22`,
                borderColor: tokens.neonPrimary,
                color: tokens.neonPrimary,
              }}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Copy Direct Link</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] mt-3" style={{ color: tokens.textSecondary }}>
            Send this room code or direct link to your friend anywhere in the world to start playing!
          </p>
        </div>
      )}
    </div>
  );
}
