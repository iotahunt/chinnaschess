import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Square, PieceSymbol, Color } from 'chess.js';
import { ChessEngine, MoveExecutionResult } from '../lib/chess';
import { useTheme } from '../lib/theme';
import { soundEngine } from '../lib/sound';

interface ChessBoardProps {
  engine: ChessEngine;
  playerColor?: 'w' | 'b';
  interactive?: boolean;
  onMove?: (result: MoveExecutionResult) => void;
  lastMove?: { from: Square; to: Square } | null;
}

// Staunton Vector Chess Pieces (Clean, vector SVGs for crisp display at all resolutions)
const PieceSVG: React.FC<{ piece: string; color: 'w' | 'b' }> = ({ piece, color }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#14111d';
  const stroke = isWhite ? '#261b2f' : '#f0d9ff';
  const shadow = isWhite ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'drop-shadow(0 0 6px rgba(255,102,178,0.35))';

  switch (piece.toLowerCase()) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: shadow }}>
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: shadow }}>
          <path
            d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="25.5" r="1.5" fill={isWhite ? '#000' : '#fff'} />
        </svg>
      );
    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: shadow }}>
          <path
            d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M17.5 26h10M22.5 21v10" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: shadow }}>
          <path
            d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm2.5-4l1.5-16h13l1.5 16h-16zm-1.5-17l-1.5-4h23l-1.5 4h-20zM11 11h4v4h-4v-4zm8 0h7v4h-7v-4zm11 0h4v4h-4v-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: shadow }}>
          <path
            d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-2a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 2a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm23 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-8.5-15-8.5 15-7-11 2 12zm0 3c9-1 18-1 27 0-1 4-3 7-5 9H14c-2-2-4-5-5-9zm3 10h21v2H12v-2z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className="w-full h-full p-1" style={{ filter: shadow }}>
          <path
            d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 16.5 3.5 22 0 0-5.5-.5-12-4-14.5-4 3-10 3-14 0-3.5 2.5-4 9-4 14.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M11.5 30c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0m-22 3.5c5.5-3 16.5-3 22 0" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    default:
      return null;
  }
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessBoard: React.FC<ChessBoardProps> = ({
  engine,
  playerColor = 'w',
  interactive = true,
  onMove,
  lastMove,
}) => {
  const { tokens } = useTheme();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalDestinations, setLegalDestinations] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const gameState = engine.getState();
  const turn = gameState.turn;
  const isMyTurn = interactive && (playerColor === undefined || playerColor === turn);

  // Determine square list based on board orientation
  const isFlipped = playerColor === 'b';
  const displayFiles = isFlipped ? [...FILES].reverse() : FILES;
  const displayRanks = isFlipped ? [...RANKS].reverse() : RANKS;

  // Clear selections if turn or FEN changes externally
  useEffect(() => {
    setSelectedSquare(null);
    setLegalDestinations([]);
    setPendingPromotion(null);
  }, [gameState.fen]);

  const handleSquareClick = useCallback(
    (sq: Square) => {
      if (!interactive) return;

      const pieceOnSquare = engine.getGame().get(sq);

      // If already selected a square and clicking a legal destination:
      if (selectedSquare && legalDestinations.includes(sq)) {
        const movingPiece = engine.getGame().get(selectedSquare);
        const isPawn = movingPiece && movingPiece.type === 'p';
        const isPromotionRank =
          (movingPiece?.color === 'w' && sq[1] === '8') ||
          (movingPiece?.color === 'b' && sq[1] === '1');

        if (isPawn && isPromotionRank) {
          // Open promotion selector
          setPendingPromotion({ from: selectedSquare, to: sq });
          return;
        }

        // Execute move
        const result = engine.executeMove(selectedSquare, sq);
        if (result.success) {
          if (result.auraDelta > 0) {
            soundEngine.playCapture(result.auraDelta);
          } else {
            soundEngine.playMove();
          }
          if (result.isCheck && !result.isCheckmate) {
            soundEngine.playCheck();
          }
          setSelectedSquare(null);
          setLegalDestinations([]);
          onMove?.(result);
        }
        return;
      }

      // If clicking own piece, select it and compute legal moves
      if (pieceOnSquare && pieceOnSquare.color === turn) {
        if (!isMyTurn) return; // Prevent moving opponent pieces
        setSelectedSquare(sq);
        const legal = engine.getLegalMoves(sq);
        setLegalDestinations(legal);
        return;
      }

      // Deselect if clicking empty space or invalid piece
      setSelectedSquare(null);
      setLegalDestinations([]);
    },
    [interactive, selectedSquare, legalDestinations, engine, turn, isMyTurn, onMove]
  );

  const handlePromotionSelect = (promo: PieceSymbol) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    const result = engine.executeMove(from, to, promo);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalDestinations([]);

    if (result.success) {
      if (result.auraDelta > 0) {
        soundEngine.playCapture(result.auraDelta);
      } else {
        soundEngine.playMove();
      }
      if (result.isCheck && !result.isCheckmate) {
        soundEngine.playCheck();
      }
      onMove?.(result);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sq: Square) => {
    if (!interactive || !isMyTurn) {
      e.preventDefault();
      return;
    }
    const piece = engine.getGame().get(sq);
    if (!piece || piece.color !== turn) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(sq);
    setSelectedSquare(sq);
    setLegalDestinations(engine.getLegalMoves(sq));
    e.dataTransfer.setData('text/plain', sq);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, sq: Square) => {
    e.preventDefault();
    const sourceSq = (e.dataTransfer.getData('text/plain') as Square) || draggedSquare;
    setDraggedSquare(null);
    if (!sourceSq) return;

    if (legalDestinations.includes(sq)) {
      const movingPiece = engine.getGame().get(sourceSq);
      const isPawn = movingPiece && movingPiece.type === 'p';
      const isPromotionRank =
        (movingPiece?.color === 'w' && sq[1] === '8') ||
        (movingPiece?.color === 'b' && sq[1] === '1');

      if (isPawn && isPromotionRank) {
        setPendingPromotion({ from: sourceSq, to: sq });
        return;
      }

      const result = engine.executeMove(sourceSq, sq);
      if (result.success) {
        if (result.auraDelta > 0) {
          soundEngine.playCapture(result.auraDelta);
        } else {
          soundEngine.playMove();
        }
        if (result.isCheck && !result.isCheckmate) {
          soundEngine.playCheck();
        }
        setSelectedSquare(null);
        setLegalDestinations([]);
        onMove?.(result);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[540px] mx-auto">
      {/* Outer Neon Glow Frame */}
      <div
        ref={boardContainerRef}
        className="relative w-full aspect-square rounded-2xl p-2 sm:p-3.5 border transition-all duration-300 shadow-2xl"
        style={{
          backgroundColor: tokens.bgSecondary,
          borderColor: tokens.neonPrimary,
          boxShadow: tokens.neonGlowStrong,
        }}
      >
        {/* The 8x8 Chess Grid */}
        <div className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-black/30">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, fIdx) => {
              const sq = (file + rank) as Square;
              const isDark = (rIdx + fIdx) % 2 === 1;
              const piece = engine.getGame().get(sq);
              const isSelected = selectedSquare === sq;
              const isLegalDest = legalDestinations.includes(sq);
              const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isKingInCheck = gameState.isCheck && gameState.inCheckSquare === sq;

              // Background coloring
              let squareBg = isDark ? tokens.boardDarkSquare : tokens.boardLightSquare;
              if (isLastMove) {
                squareBg = isDark ? `${tokens.neonPrimary}44` : `${tokens.neonPrimary}33`;
              }
              if (isSelected) {
                squareBg = `${tokens.neonPrimary}66`;
              }

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, sq)}
                  style={{
                    backgroundColor: squareBg,
                    boxShadow: isKingInCheck
                      ? 'inset 0 0 16px rgba(255, 30, 30, 0.9), 0 0 10px rgba(255, 30, 30, 0.8)'
                      : isSelected
                      ? `inset 0 0 12px ${tokens.neonPrimary}`
                      : 'none',
                  }}
                  className={`
                    relative flex items-center justify-center cursor-pointer transition-colors duration-150
                    ${isKingInCheck ? 'animate-pulse' : ''}
                  `}
                >
                  {/* File & Rank coordinate labels */}
                  {fIdx === 0 && (
                    <span
                      className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold pointer-events-none opacity-60"
                      style={{ color: isDark ? tokens.boardLightSquare : tokens.boardDarkSquare }}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold pointer-events-none opacity-60"
                      style={{ color: isDark ? tokens.boardLightSquare : tokens.boardDarkSquare }}
                    >
                      {file}
                    </span>
                  )}

                  {/* King Check Red Warning Circle */}
                  {isKingInCheck && (
                    <div className="absolute inset-1 rounded-full bg-red-600/30 border border-red-500 animate-ping pointer-events-none" />
                  )}

                  {/* Legal Move Indicators */}
                  {isLegalDest && (
                    <div
                      className="absolute z-10 pointer-events-none transition-transform"
                      style={{
                        width: piece ? '85%' : '30%',
                        height: piece ? '85%' : '30%',
                        borderRadius: piece ? '12px' : '50%',
                        backgroundColor: piece ? 'transparent' : tokens.neonPrimary,
                        border: piece ? `3.5px solid ${tokens.neonPrimary}` : 'none',
                        boxShadow: `0 0 12px ${tokens.neonPrimary}`,
                        opacity: piece ? 0.95 : 0.8,
                      }}
                    />
                  )}

                  {/* Chess Piece Graphic */}
                  {piece && (
                    <div
                      draggable={interactive && isMyTurn && piece.color === turn}
                      onDragStart={(e) => handleDragStart(e, sq)}
                      className={`
                        w-full h-full flex items-center justify-center z-10 transition-transform duration-100
                        ${interactive && isMyTurn && piece.color === turn ? 'hover:scale-105 active:scale-95' : ''}
                      `}
                    >
                      <PieceSVG piece={piece.type} color={piece.color as 'w' | 'b'} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Pawn Promotion Modal */}
        {pendingPromotion && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm rounded-2xl animate-fadeIn">
            <div
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border shadow-2xl"
              style={{
                backgroundColor: tokens.cardBg,
                borderColor: tokens.neonPrimary,
                boxShadow: tokens.neonGlowStrong,
              }}
            >
              <div
                className="text-xs uppercase font-extrabold tracking-widest"
                style={{ color: tokens.textSecondary }}
              >
                PROMOTION CHOICE
              </div>
              <div className="flex gap-2">
                {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handlePromotionSelect(sym)}
                    className="w-14 h-14 p-2 rounded-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderColor: tokens.cardBorder,
                      boxShadow: `0 0 8px ${tokens.neonPrimary}33`,
                    }}
                  >
                    <PieceSVG piece={sym} color={turn as 'w' | 'b'} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Turn & Status Indicator Bar */}
      <div className="flex items-center justify-between w-full mt-3 px-2 text-xs font-bold tracking-wider">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: turn === 'w' ? '#ffffff' : tokens.neonPrimary,
              boxShadow: `0 0 8px ${tokens.neonPrimary}`,
            }}
          />
          <span style={{ color: tokens.text }}>
            {gameState.isGameOver
              ? 'GAME CONCLUDED'
              : isMyTurn
              ? 'YOUR TURN'
              : "OPPONENT'S TURN"}
          </span>
          <span style={{ color: tokens.textMuted }}>
            ({turn === 'w' ? 'White' : 'Black'} to move)
          </span>
        </div>

        {gameState.isCheck && !gameState.isCheckmate && (
          <div
            className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-widest text-red-400 bg-red-950/70 border border-red-500 animate-pulse"
          >
            CHECK!
          </div>
        )}
      </div>
    </div>
  );
};
