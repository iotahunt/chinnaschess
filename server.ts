import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export interface GameRecord {
  id: string;
  room_code: string;
  white_user_id: string;
  black_user_id: string | null;
  fen: string;
  status: 'waiting' | 'active' | 'finished';
  winner_id: string | null;
  white_aura: number;
  black_aura: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRecord {
  id: string;
  email: string;
  domain_expansions: number;
  created_at: string;
}

// In-memory persistent database for global cross-device multiplayer
const games = new Map<string, GameRecord>();
const gamesByCode = new Map<string, string>(); // room_code -> game_id
const profiles = new Map<string, ProfileRecord>();

// SSE subscriber connections per game id
const gameStreams = new Map<string, Set<Response>>();

function broadcastGameUpdate(game: GameRecord) {
  const subscribers = gameStreams.get(game.id);
  if (subscribers && subscribers.size > 0) {
    const payload = `data: ${JSON.stringify(game)}\n\n`;
    for (const client of subscribers) {
      try {
        client.write(payload);
      } catch (err) {
        console.error('Failed to send SSE to client:', err);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      activeGames: games.size,
      connectedStreams: Array.from(gameStreams.values()).reduce((acc, s) => acc + s.size, 0),
    });
  });

  // --- GAME API ENDPOINTS ---

  // Create game
  app.post('/api/games', (req: Request, res: Response) => {
    try {
      const { roomCode, whiteUserId, startingFen } = req.body;
      if (!roomCode || !whiteUserId) {
        return res.status(400).json({ error: 'roomCode and whiteUserId are required' });
      }

      const upperCode = String(roomCode).trim().toUpperCase();
      const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      const newGame: GameRecord = {
        id: gameId,
        room_code: upperCode,
        white_user_id: String(whiteUserId),
        black_user_id: null,
        fen: startingFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        status: 'waiting',
        winner_id: null,
        white_aura: 0,
        black_aura: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      games.set(gameId, newGame);
      gamesByCode.set(upperCode, gameId);

      return res.status(201).json(newGame);
    } catch (err: unknown) {
      console.error('Error creating game:', err);
      return res.status(500).json({ error: 'Failed to create game' });
    }
  });

  // Sync game into server memory (from Firestore or client)
  app.post('/api/games/sync', (req: Request, res: Response) => {
    try {
      const game = req.body as GameRecord;
      if (!game || !game.id) {
        return res.status(400).json({ error: 'Valid game object is required' });
      }
      games.set(game.id, game);
      if (game.room_code) {
        gamesByCode.set(game.room_code.toUpperCase(), game.id);
      }
      broadcastGameUpdate(game);
      return res.json({ status: 'synced', game });
    } catch (err) {
      console.error('Error syncing game:', err);
      return res.status(500).json({ error: 'Failed to sync game' });
    }
  });

  // Find game by room code
  app.get('/api/games/code/:code', (req: Request, res: Response) => {
    const code = String(req.params.code).trim().toUpperCase();
    const gameId = gamesByCode.get(code);
    if (!gameId) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json(game);
  });

  // Get game by ID
  app.get('/api/games/:id', (req: Request, res: Response) => {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    return res.json(game);
  });

  // Join game as Black player
  app.post('/api/games/:id/join', (req: Request, res: Response) => {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { blackUserId } = req.body;
    if (!blackUserId) {
      return res.status(400).json({ error: 'blackUserId is required' });
    }

    // If already joined or slot taken by someone else
    if (game.black_user_id && game.black_user_id !== blackUserId) {
      return res.status(409).json({ error: 'Game already has two players' });
    }

    game.black_user_id = String(blackUserId);
    game.status = 'active';
    game.updated_at = new Date().toISOString();

    games.set(game.id, game);
    broadcastGameUpdate(game);

    return res.json(game);
  });

  // Update game state (moves, auras, game over) - supports both PATCH and POST
  const handleUpdateGameState = (req: Request, res: Response) => {
    let game = games.get(req.params.id);
    const { fen, whiteAura, blackAura, status, winnerId, roomCode, whiteUserId, blackUserId } = req.body;

    if (!game) {
      // Re-create game if synced from Firestore
      game = {
        id: req.params.id,
        room_code: roomCode || 'ROOM',
        white_user_id: whiteUserId || 'white',
        black_user_id: blackUserId || null,
        fen: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        status: status || 'active',
        winner_id: winnerId || null,
        white_aura: Number(whiteAura) || 0,
        black_aura: Number(blackAura) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      games.set(game.id, game);
      if (game.room_code) {
        gamesByCode.set(game.room_code.toUpperCase(), game.id);
      }
    } else {
      if (fen !== undefined) game.fen = fen;
      if (whiteAura !== undefined) game.white_aura = Number(whiteAura);
      if (blackAura !== undefined) game.black_aura = Number(blackAura);
      if (status !== undefined) game.status = status;
      if (winnerId !== undefined) game.winner_id = winnerId;
      if (blackUserId !== undefined) game.black_user_id = blackUserId;
      game.updated_at = new Date().toISOString();
      games.set(game.id, game);
    }

    broadcastGameUpdate(game);
    return res.json(game);
  };

  app.patch('/api/games/:id', handleUpdateGameState);
  app.post('/api/games/:id', handleUpdateGameState);

  // Realtime Server-Sent Events (SSE) stream for instant moves
  app.get('/api/games/:id/stream', (req: Request, res: Response) => {
    const gameId = req.params.id;
    const game = games.get(gameId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Register client
    if (!gameStreams.has(gameId)) {
      gameStreams.set(gameId, new Set());
    }
    const clientSet = gameStreams.get(gameId)!;
    clientSet.add(res);

    // Immediately push current state if available
    if (game) {
      res.write(`data: ${JSON.stringify(game)}\n\n`);
    }

    // Send keep-alive comments every 15s to keep proxy connections alive
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      clientSet.delete(res);
      if (clientSet.size === 0) {
        gameStreams.delete(gameId);
      }
    });
  });

  // --- PROFILES API ENDPOINTS ---
  app.get('/api/profiles/:id', (req: Request, res: Response) => {
    const profile = profiles.get(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.json(profile);
  });

  app.post('/api/profiles', (req: Request, res: Response) => {
    const { id, email, domain_expansions } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'id and email are required' });
    }

    const existing = profiles.get(id);
    const updated: ProfileRecord = {
      id: String(id),
      email: String(email),
      domain_expansions: domain_expansions ?? existing?.domain_expansions ?? 0,
      created_at: existing?.created_at || new Date().toISOString(),
    };
    profiles.set(id, updated);
    return res.json(updated);
  });

  app.post('/api/profiles/:id/domain-expansion', (req: Request, res: Response) => {
    const id = req.params.id;
    const existing = profiles.get(id);
    const current = existing?.domain_expansions ?? 0;
    const next = current + 1;

    const updated: ProfileRecord = {
      id,
      email: existing?.email || `player_${id.substring(0, 6)}@chinna.chess`,
      domain_expansions: next,
      created_at: existing?.created_at || new Date().toISOString(),
    };
    profiles.set(id, updated);
    return res.json({ domain_expansions: next });
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chinna's Chess live multiplayer server running on port ${PORT}`);
  });
}

startServer();
