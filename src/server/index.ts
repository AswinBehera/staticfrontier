import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, GameState, PhraseFoundResponse, MetaSolveResponse, MapResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { PuzzleLoader } from '../shared/utils/puzzleLoader';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Static Frontier Game Endpoints
router.get('/api/game/init', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }

    // Get or initialize game state
    const gameStateKey = `game:${postId}`;
    const existingState = await redis.get(gameStateKey);
    
    if (existingState) {
      res.json(JSON.parse(existingState));
    } else {
      // Initialize new game state with a random puzzle
      const randomPuzzle = PuzzleLoader.getRandomPuzzle();
      const broadcast = PuzzleLoader.puzzleToBroadcast(randomPuzzle);
      
      const initialState: GameState = {
        broadcast,
        foundPhrases: [],
        isMetaSolved: false,
        asciiMap: Array(10).fill(null).map(() => Array(10).fill('.')),
        userEchoPoints: 0
      };
      
      await redis.set(gameStateKey, JSON.stringify(initialState));
      res.json(initialState);
    }
  } catch (error) {
    console.error('Game init error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to initialize game' });
  }
});

router.post('/api/game/phrase-check', async (req, res): Promise<void> => {
  try {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }

    const { frequency, modulation } = req.body;
    const gameStateKey = `game:${postId}`;
    const gameStateData = await redis.get(gameStateKey);
    
    if (!gameStateData) {
      res.status(400).json({ success: false, message: 'Game not initialized' });
      return;
    }

    const gameState: GameState = JSON.parse(gameStateData);
    
    // Check if frequency and modulation match any phrase
    const matchingPhrase = gameState.broadcast.phrases.find(
      phrase => 
        Math.abs(phrase.frequency - frequency) < 0.5 && 
        Math.abs(phrase.modulation - modulation) < 0.5 &&
        !gameState.foundPhrases.includes(phrase.text)
    );

    if (matchingPhrase) {
      const updatedFoundPhrases = [...gameState.foundPhrases, matchingPhrase.text];
      const updatedGameState = { ...gameState, foundPhrases: updatedFoundPhrases };
      await redis.set(gameStateKey, JSON.stringify(updatedGameState));
      
      res.json({ success: true, phrase: matchingPhrase.text, message: 'Signal decoded!' });
    } else {
      res.json({ success: false, message: 'No signal at this frequency' });
    }
  } catch (error) {
    console.error('Phrase check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check phrase' });
  }
});

router.post('/api/game/meta-solve', async (req, res): Promise<void> => {
  try {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }

    const { answer } = req.body;
    const gameStateKey = `game:${postId}`;
    const gameStateData = await redis.get(gameStateKey);
    
    if (!gameStateData) {
      res.status(400).json({ success: false, message: 'Game not initialized' });
      return;
    }

    const gameState: GameState = JSON.parse(gameStateData);
    
    if (gameState.isMetaSolved) {
      res.json({ success: false, message: 'Meta puzzle already solved' });
      return;
    }

    if (gameState.foundPhrases.length !== gameState.broadcast.phrases.length) {
      res.json({ success: false, message: 'All phrases must be found first' });
      return;
    }

    const isCorrect = answer.toLowerCase().trim() === gameState.broadcast.metaAnswer.toLowerCase();
    
    if (isCorrect) {
      // First correct answer wins
      const isWinner = !gameState.winner;
      const echoPoints = isWinner ? 0 : 10; // Echo points for non-winners
      
      // Update ASCII map
      const updatedMap = [...gameState.asciiMap];
      if (isWinner) {
        // Winner gets a 'W' in the center
        updatedMap[5][5] = 'W';
      } else {
        // Echo points get an 'E' in a random location
        const randomRow = Math.floor(Math.random() * 10);
        const randomCol = Math.floor(Math.random() * 10);
        updatedMap[randomRow][randomCol] = 'E';
      }
      
      const updatedGameState = {
        ...gameState,
        isMetaSolved: true,
        winner: isWinner ? 'You' : gameState.winner,
        asciiMap: updatedMap,
        userEchoPoints: gameState.userEchoPoints + echoPoints
      };
      
      await redis.set(gameStateKey, JSON.stringify(updatedGameState));
      
      res.json({ 
        success: true, 
        isWinner, 
        echoPoints,
        message: isWinner ? 'Congratulations! You claimed the territory!' : `Correct! You earned ${echoPoints} Echo Points.`
      });
    } else {
      res.json({ success: false, message: 'Incorrect answer' });
    }
  } catch (error) {
    console.error('Meta solve error:', error);
    res.status(500).json({ success: false, message: 'Failed to solve meta puzzle' });
  }
});

router.get('/api/game/map', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }

    const gameStateKey = `game:${postId}`;
    const gameStateData = await redis.get(gameStateKey);
    
    if (!gameStateData) {
      res.status(400).json({ status: 'error', message: 'Game not initialized' });
      return;
    }

    const gameState: GameState = JSON.parse(gameStateData);
    
    res.json({
      asciiMap: gameState.asciiMap,
      winner: gameState.winner
    } as MapResponse);
  } catch (error) {
    console.error('Map error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get map' });
  }
});

// Puzzle management endpoints
router.get('/api/puzzles', async (_req, res): Promise<void> => {
  try {
    const puzzles = PuzzleLoader.getAllPuzzles();
    res.json({ puzzles });
  } catch (error) {
    console.error('Puzzles error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get puzzles' });
  }
});

router.get('/api/puzzles/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const puzzle = PuzzleLoader.getPuzzleById(id);
    
    if (!puzzle) {
      res.status(404).json({ status: 'error', message: 'Puzzle not found' });
      return;
    }
    
    res.json({ puzzle });
  } catch (error) {
    console.error('Puzzle error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get puzzle' });
  }
});

router.get('/api/puzzles/category/:category', async (req, res): Promise<void> => {
  try {
    const { category } = req.params;
    const puzzles = PuzzleLoader.getPuzzlesByCategory(category);
    res.json({ puzzles });
  } catch (error) {
    console.error('Category puzzles error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get category puzzles' });
  }
});

router.get('/api/puzzles/difficulty/:difficulty', async (req, res): Promise<void> => {
  try {
    const { difficulty } = req.params;
    const puzzles = PuzzleLoader.getPuzzlesByDifficulty(difficulty);
    res.json({ puzzles });
  } catch (error) {
    console.error('Difficulty puzzles error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get difficulty puzzles' });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
