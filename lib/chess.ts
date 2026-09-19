import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { getCaptureAuraDelta } from './aura';

export interface MoveExecutionResult {
  success: boolean;
  error?: string;
  capturedPiece?: string;
  auraDelta: number;
  newFen: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  drawReason?: 'stalemate' | 'threefold' | 'fifty-moves' | 'insufficient-material';
  san?: string;
}

export interface ChessEngineState {
  fen: string;
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  drawReason?: string;
  isGameOver: boolean;
  inCheckSquare?: Square | null;
}

export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  getGame(): Chess {
    return this.game;
  }

  getFen(): string {
    return this.game.fen();
  }

  getTurn(): 'w' | 'b' {
    return this.game.turn();
  }

  load(fen: string): boolean {
    try {
      this.game.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    this.game.reset();
  }

  /**
   * Returns list of legal destination squares for a given square
   */
  getLegalMoves(square: Square): Square[] {
    const moves = this.game.moves({ square, verbose: true });
    return moves.map(m => m.to as Square);
  }

  /**
   * Finds the square of the king currently to move (useful for check highlighting)
   */
  getKingSquare(color: Color): Square | null {
    const board = this.game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === color) {
          return p.square;
        }
      }
    }
    return null;
  }

  getState(): ChessEngineState {
    const isCheck = this.game.isCheck();
    const isCheckmate = this.game.isCheckmate();
    const isStalemate = this.game.isStalemate();
    const isThreefold = this.game.isThreefoldRepetition();
    const isFifty = this.game.isDraw() && !isStalemate && !isThreefold && !this.game.isInsufficientMaterial();
    const isInsufficient = this.game.isInsufficientMaterial();

    let drawReason: string | undefined;
    if (isStalemate) drawReason = 'Stalemate';
    else if (isThreefold) drawReason = 'Threefold Repetition';
    else if (isFifty) drawReason = '50-Move Rule';
    else if (isInsufficient) drawReason = 'Insufficient Material';

    const isDraw = this.game.isDraw();

    const turn = this.game.turn();
    const kingSquare = isCheck ? this.getKingSquare(turn) : null;

    return {
      fen: this.game.fen(),
      turn,
      isCheck,
      isCheckmate,
      isDraw,
      drawReason,
      isGameOver: this.game.isGameOver(),
      inCheckSquare: kingSquare,
    };
  }

  /**
   * Attempts to execute a move
   */
  executeMove(
    from: Square,
    to: Square,
    promotion: PieceSymbol = 'q'
  ): MoveExecutionResult {
    try {
      // Check if this move requires pawn promotion
      const piece = this.game.get(from);
      const isPawn = piece && piece.type === 'p';
      const isPromotionRank = (piece?.color === 'w' && to[1] === '8') || (piece?.color === 'b' && to[1] === '1');
      const promoChoice = isPawn && isPromotionRank ? promotion : undefined;

      // Note what piece was on destination before moving
      const targetPiece = this.game.get(to);
      
      const move = this.game.move({
        from,
        to,
        promotion: promoChoice,
      });

      if (!move) {
        return {
          success: false,
          error: 'Illegal move',
          auraDelta: 0,
          newFen: this.game.fen(),
          isCheck: this.game.isCheck(),
          isCheckmate: this.game.isCheckmate(),
          isDraw: this.game.isDraw(),
        };
      }

      // Detect capture: either direct or en-passant
      let capturedPieceType: string | undefined = undefined;
      if (move.captured) {
        capturedPieceType = move.captured;
      } else if (targetPiece) {
        capturedPieceType = targetPiece.type;
      }

      const auraDelta = capturedPieceType ? getCaptureAuraDelta(capturedPieceType) : 0;

      let drawReason: 'stalemate' | 'threefold' | 'fifty-moves' | 'insufficient-material' | undefined;
      if (this.game.isStalemate()) drawReason = 'stalemate';
      else if (this.game.isThreefoldRepetition()) drawReason = 'threefold';
      else if (this.game.isInsufficientMaterial()) drawReason = 'insufficient-material';
      else if (this.game.isDraw()) drawReason = 'fifty-moves';

      return {
        success: true,
        capturedPiece: capturedPieceType,
        auraDelta,
        newFen: this.game.fen(),
        isCheck: this.game.isCheck(),
        isCheckmate: this.game.isCheckmate(),
        isDraw: this.game.isDraw(),
        drawReason,
        san: move.san,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: (err as Error)?.message || 'Invalid move',
        auraDelta: 0,
        newFen: this.game.fen(),
        isCheck: this.game.isCheck(),
        isCheckmate: this.game.isCheckmate(),
        isDraw: this.game.isDraw(),
      };
    }
  }
}
