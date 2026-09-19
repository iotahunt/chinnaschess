/**
 * Aura logic for Chinna's Chess
 * Piece value map and calculation helpers
 */

export const PIECE_VALUES: Record<string, number> = {
  p: 100, // Pawn
  P: 100,
  n: 300, // Knight
  N: 300,
  b: 300, // Bishop
  B: 300,
  r: 500, // Rook
  R: 500,
  q: 900, // Queen
  Q: 900,
  k: 0,   // King (game ends before capture)
  K: 0,
};

/**
 * Returns the aura delta gained by capturer and lost by opponent
 * @param piece The captured piece type ('p', 'n', 'b', 'r', 'q', 'k')
 */
export function getCaptureAuraDelta(piece: string): number {
  const normalized = piece.toLowerCase();
  return PIECE_VALUES[normalized] ?? 0;
}

export interface AuraState {
  whiteAura: number;
  blackAura: number;
}
