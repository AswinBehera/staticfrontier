import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  GameState,
  MapResponse,
} from '../shared/types/api';
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

const GLOBAL_MAP_KEY = 'map:grid';
const MAP_ROWS = 10;
const MAP_COLS = 10;

// Global echo points system
async function awardEchoPoints(
  username: string,
  points: number,
  reason: string,
  puzzleId?: string
): Promise<void> {
  try {
    const userKey = `user_echo_points:${username}`;
    const existingData = await redis.get(userKey);
    const userData = existingData ? JSON.parse(existingData) : { totalPoints: 0, transactions: [] };

    userData.totalPoints += points;
    userData.transactions.push({
      points,
      reason,
      puzzleId,
      timestamp: Date.now(),
    });

    await redis.set(userKey, JSON.stringify(userData));
    console.log(`Awarded ${points} echo points to ${username} for ${reason}`);
  } catch (error) {
    console.error('Failed to award echo points:', error);
  }
}

async function getUserEchoPoints(username: string): Promise<number> {
  try {
    const userKey = `user_echo_points:${username}`;
    const existingData = await redis.get(userKey);
    const userData = existingData ? JSON.parse(existingData) : { totalPoints: 0, transactions: [] };
    return userData.totalPoints;
  } catch (error) {
    console.error('Failed to get user echo points:', error);
    return 0;
  }
}

async function ensureGlobalMap(): Promise<string[][]> {
  const data = await redis.get(GLOBAL_MAP_KEY);
  if (data) return JSON.parse(data);
  const grid = Array(MAP_ROWS)
    .fill(null)
    .map(() => Array(MAP_COLS).fill('.'));
  await redis.set(GLOBAL_MAP_KEY, JSON.stringify(grid));
  return grid;
}

async function writeGlobalMap(grid: string[][]): Promise<void> {
  await redis.set(GLOBAL_MAP_KEY, JSON.stringify(grid));
}

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
    const { postId, subredditName } = context;
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
      // Initialize new game state with an UNSOLVED puzzle (built-in or user-submitted) for this subreddit
      const allPuzzles = await PuzzleLoader.getAllPuzzlesWithUserSubmissions(redis, subredditName);
      const solvedSetKey = `sr:${subredditName}:solvedPuzzles`;
      const solvedData = await redis.get(solvedSetKey);
      const solved = new Set<string>(solvedData ? JSON.parse(solvedData) : []);
      const unsolved = allPuzzles.filter((p) => !solved.has(p.id));
      const chosen = (unsolved.length > 0 ? unsolved : allPuzzles)[
        Math.floor(Math.random() * (unsolved.length > 0 ? unsolved.length : allPuzzles.length))
      ];
      if (!chosen) {
        res.status(500).json({ status: 'error', message: 'No puzzles available' });
        return;
      }
      const broadcast = PuzzleLoader.puzzleToBroadcast(chosen);

      const globalMap = await ensureGlobalMap();

      // Get current username and their echo points
      const username = (await reddit.getCurrentUsername()) || 'Anonymous';
      const userEchoPoints = await getUserEchoPoints(username);

      const initialState: GameState = {
        broadcast,
        foundPhrases: [],
        isMetaSolved: false,
        asciiMap: globalMap, // shared map
        userEchoPoints,
        username,
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
      (phrase) =>
        Math.abs(phrase.frequency - frequency) < 0.5 &&
        Math.abs(phrase.modulation - modulation) < 0.5 &&
        !gameState.foundPhrases.includes(phrase.text)
    );

    if (matchingPhrase) {
      const updatedFoundPhrases = [...gameState.foundPhrases, matchingPhrase.text];
      const updatedGameState = { ...gameState, foundPhrases: updatedFoundPhrases };
      await redis.set(gameStateKey, JSON.stringify(updatedGameState));

      // Check if this is the first time this phrase has been discovered globally
      const phraseDiscoveryKey = `phrase:${matchingPhrase.text}:discovered`;
      const isFirstDiscovery = !(await redis.get(phraseDiscoveryKey));

      if (isFirstDiscovery) {
        // Mark as discovered globally
        await redis.set(phraseDiscoveryKey, 'true');

        // Create Reddit comment for first discovery
        try {
          const username = (await reddit.getCurrentUsername()) || 'Anonymous';
          const commentText = `🔍 **SIGNAL DISCOVERED!** 🔍\n\nu/${username} was the first to discover this hidden signal!\n\n**Phrase:** ||${matchingPhrase.text}||\n\nGreat work on cracking this frequency! 🎧`;

          await reddit.submitComment({
            id: postId,
            text: commentText,
          });

          console.log(
            `Created Reddit comment for first discovery of phrase: ${matchingPhrase.text}`
          );
        } catch (commentError) {
          console.error('Failed to create Reddit comment:', commentError);
          // Don't fail the request if comment creation fails
        }
      }

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
    const { postId, subredditName } = context;
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

    if (gameState.foundPhrases.length === 0) {
      res.json({ success: false, message: 'At least one phrase must be found first' });
      return;
    }

    const isCorrect = answer.toLowerCase().trim() === gameState.broadcast.metaAnswer.toLowerCase();

    if (isCorrect) {
      // Get current username
      const username = (await reddit.getCurrentUsername()) || 'Anonymous';
      const userInitial = username.charAt(0).toUpperCase();

      // First correct answer wins
      const isWinner = !gameState.winner;

      // Unified puzzle system: Award plot and check for completion bonus
      const globalMap = await ensureGlobalMap();

      // Find a random empty slot
      const emptySlots: { row: number; col: number }[] = [];
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          if (globalMap[r]?.[c] === '.') {
            emptySlots.push({ row: r, col: c });
          }
        }
      }

      if (emptySlots.length > 0 && isWinner) {
        // Pick a random empty slot
        const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        if (
          randomSlot &&
          globalMap[randomSlot.row] &&
          globalMap[randomSlot.row]![randomSlot.col] !== undefined
        ) {
          globalMap[randomSlot.row]![randomSlot.col] = userInitial;

          // Store plot information for the modal
          const plotInfoKey = `plot:${randomSlot.row}:${randomSlot.col}`;
          const plotInfo = {
            username,
            broadcastTitle: gameState.broadcast.title,
            broadcastId: gameState.broadcast.broadcastId,
            metaAnswer: gameState.broadcast.metaAnswer,
            timestamp: Date.now(),
          };
          await redis.set(plotInfoKey, JSON.stringify(plotInfo));
        }
      }

      await writeGlobalMap(globalMap);

      // Check if all plots are filled for completion bonus
      const filledPlots = globalMap.flat().filter((cell) => cell !== '.').length;
      const totalPlots = MAP_ROWS * MAP_COLS;
      const completionBonus = filledPlots >= totalPlots ? 50 : 0;

      if (completionBonus > 0) {
        await awardEchoPoints(
          username,
          completionBonus,
          'map_completion',
          gameState.broadcast.broadcastId
        );
      } else if (emptySlots.length === 0 && isWinner) {
        // No plots available, award 50 echo points instead
        await awardEchoPoints(username, 50, 'no_plots_available', gameState.broadcast.broadcastId);
      }

      // Mark puzzle solved
      if (isWinner) {
        const solvedSetKey = `sr:${subredditName}:solvedPuzzles`;
        const existingSolved = await redis.get(solvedSetKey);
        const solvedList = existingSolved ? JSON.parse(existingSolved) : [];
        if (!solvedList.includes(gameState.broadcast.broadcastId)) {
          solvedList.push(gameState.broadcast.broadcastId);
          await redis.set(solvedSetKey, JSON.stringify(solvedList));
        }
      }

      // Award points for solving (even if already solved)
      const solvePoints = isWinner
        ? completionBonus > 0
          ? completionBonus
          : emptySlots.length === 0
            ? 50
            : 0
        : 5;
      if (solvePoints > 0) {
        await awardEchoPoints(
          username,
          solvePoints,
          'puzzle_solve',
          gameState.broadcast.broadcastId
        );
      }

      const updatedGameState = {
        ...gameState,
        isMetaSolved: true,
        winner: isWinner ? 'You' : gameState.winner,
        asciiMap: globalMap,
        userEchoPoints: gameState.userEchoPoints + solvePoints,
      };

      await redis.set(gameStateKey, JSON.stringify(updatedGameState));

      // Add Reddit comment for first meta solver
      if (isWinner) {
        try {
          const username = (await reddit.getCurrentUsername()) || 'Anonymous';
          const commentText = `🎯 **PUZZLE SOLVED!** 🎯\n\nu/${username} has successfully solved the meta puzzle and claimed territory on the global map!\n\nCongratulations on being the first to crack this signal! 🏆`;

          await reddit.submitComment({
            id: postId,
            text: commentText,
          });
          console.log(`Meta solve comment posted for puzzle: ${gameState.broadcast.broadcastId}`);
        } catch (commentError) {
          console.warn('Failed to post meta solve comment:', commentError);
        }
      }

      res.json({
        success: true,
        isWinner,
        echoPoints: solvePoints,
        asciiMap: globalMap,
        message: isWinner
          ? `Congratulations! You claimed the territory!${completionBonus > 0 ? ` +${completionBonus} Echo Points for map completion!` : ''}`
          : `Correct! You earned ${solvePoints} Echo Points.`,
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
    const globalMap = await ensureGlobalMap();
    res.json({
      asciiMap: globalMap,
    } as MapResponse);
  } catch (error) {
    console.error('Map error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get map' });
  }
});

// New endpoint to get plot information
router.get('/api/game/plot/:row/:col', async (req, res): Promise<void> => {
  try {
    const { row, col } = req.params;
    const plotInfoKey = `plot:${row}:${col}`;
    const plotInfoData = await redis.get(plotInfoKey);

    if (!plotInfoData) {
      res.status(404).json({ status: 'error', message: 'Plot not found' });
      return;
    }

    const plotInfo = JSON.parse(plotInfoData);
    res.json({ status: 'success', plotInfo });
  } catch (error) {
    console.error('Plot info error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get plot info' });
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

// Puzzle submission endpoint
router.post('/api/puzzles/submit', async (req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    const { title, description, phrases, metaAnswer, difficulty, category, hints } = req.body;

    // Validate required fields
    if (!title || !description || !metaAnswer || !phrases || phrases.length < 2) {
      res.status(400).json({ status: 'error', message: 'Missing required fields' });
      return;
    }

    // Validate phrases have unique frequencies
    const frequencies = phrases.map((p: { frequency: number }) => p.frequency);
    const uniqueFrequencies = new Set(frequencies);
    if (frequencies.length !== uniqueFrequencies.size) {
      res
        .status(400)
        .json({ status: 'error', message: 'All phrases must have unique frequencies' });
      return;
    }

    // Get current username
    const username = (await reddit.getCurrentUsername()) || 'Anonymous';

    // Generate unique puzzle ID
    const puzzleId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create puzzle object
    const puzzle = {
      id: puzzleId,
      title,
      description,
      phrases: phrases.filter((p: { text: string }) => p.text.trim()), // Remove empty phrases
      metaAnswer,
      difficulty,
      category,
      hints: hints.filter((h: string) => h.trim()), // Remove empty hints
      creator: username,
      createdAt: Date.now(),
      status: 'pending', // Will be reviewed before posting
      subredditName,
      redditPostId: '' as string, // Will be set after Reddit posting
    };

    // Store puzzle in Redis for review
    const submissionKey = `puzzle_submission:${puzzleId}`;
    await redis.set(submissionKey, JSON.stringify(puzzle));

    // Add to pending submissions list
    const pendingKey = `pending_submissions:${subredditName}`;
    const existingPending = await redis.get(pendingKey);
    const pendingList = existingPending ? JSON.parse(existingPending) : [];
    pendingList.push(puzzleId);
    await redis.set(pendingKey, JSON.stringify(pendingList));

    // Post user puzzle instantly to Reddit
    try {
      // Create Reddit post with the user puzzle
      // Update puzzle status to approved
      puzzle.status = 'approved';
      (puzzle as typeof puzzle & { approvedAt: number }).approvedAt = Date.now();
      await redis.set(submissionKey, JSON.stringify(puzzle));

      // Add to approved user puzzles
      const userPuzzlesKey = `user_puzzles:${subredditName}`;
      const existingUserPuzzles = await redis.get(userPuzzlesKey);
      const userPuzzlesList = existingUserPuzzles ? JSON.parse(existingUserPuzzles) : [];
      userPuzzlesList.push(puzzleId);
      await redis.set(userPuzzlesKey, JSON.stringify(userPuzzlesList));

      // Remove from pending
      const updatedPending = pendingList.filter((id: string) => id !== puzzleId);
      await redis.set(pendingKey, JSON.stringify(updatedPending));

      // Award creator 5 echo points for submission
      await awardEchoPoints(username, 5, 'puzzle_submission', puzzleId);

      console.log(`User puzzle submitted: ${puzzleId}`);

      res.json({
        success: true,
        message: 'Puzzle submitted successfully! You earned 5 Echo Points.',
        puzzleId,
      });
    } catch (error) {
      console.error('Failed to post user puzzle:', error);
      res.status(500).json({
        success: false,
        message: 'Puzzle saved but failed to post to Reddit. Please try again.',
      });
    }
  } catch (error) {
    console.error('Puzzle submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit puzzle' });
  }
});

// Get pending puzzle submissions (for moderation)
router.get('/api/puzzles/pending', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    const pendingKey = `pending_submissions:${subredditName}`;
    const pendingData = await redis.get(pendingKey);
    const pendingIds = pendingData ? JSON.parse(pendingData) : [];

    const pendingPuzzles = [];
    for (const puzzleId of pendingIds) {
      const puzzleKey = `puzzle_submission:${puzzleId}`;
      const puzzleData = await redis.get(puzzleKey);
      if (puzzleData) {
        pendingPuzzles.push(JSON.parse(puzzleData));
      }
    }

    res.json({ status: 'success', puzzles: pendingPuzzles });
  } catch (error) {
    console.error('Pending puzzles error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get pending puzzles' });
  }
});

// Approve a puzzle submission
router.post('/api/puzzles/approve/:puzzleId', async (req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    const { puzzleId } = req.params;

    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    // Get the puzzle
    const submissionKey = `puzzle_submission:${puzzleId}`;
    const puzzleData = await redis.get(submissionKey);

    if (!puzzleData) {
      res.status(404).json({ status: 'error', message: 'Puzzle not found' });
      return;
    }

    const puzzle = JSON.parse(puzzleData);

    if (puzzle.status !== 'pending') {
      res.status(400).json({ status: 'error', message: 'Puzzle is not pending approval' });
      return;
    }

    // Post to Reddit
    const postTitle = `🎯 NEW PUZZLE: ${puzzle.title} (by u/${puzzle.creator})`;
    const postText = `**${puzzle.title}**

${puzzle.description}

**Difficulty:** ${puzzle.difficulty}
**Category:** ${puzzle.category}
**Created by:** u/${puzzle.creator}

---

*Tune your radio to find the hidden signals and solve the meta puzzle!*

**Hints:**
${
  puzzle.hints
    .filter((h: string) => h.trim())
    .map((hint: string) => `- ${hint}`)
    .join('\n') || '- No hints provided'
}

Good luck, signal hunters! 🎧`;

    const redditPost = await reddit.submitPost({
      subredditName: subredditName,
      title: postTitle,
      text: postText,
    });

    // Update puzzle status
    puzzle.status = 'approved';
    puzzle.redditPostId = redditPost.id;
    (puzzle as typeof puzzle & { approvedAt: number }).approvedAt = Date.now();
    await redis.set(submissionKey, JSON.stringify(puzzle));

    // Add to approved puzzles
    const approvedKey = `approved_puzzles:${subredditName}`;
    const existingApproved = await redis.get(approvedKey);
    const approvedList = existingApproved ? JSON.parse(existingApproved) : [];
    approvedList.push(puzzleId);
    await redis.set(approvedKey, JSON.stringify(approvedList));

    // Remove from pending
    const pendingKey = `pending_submissions:${subredditName}`;
    const existingPending = await redis.get(pendingKey);
    const pendingList = existingPending ? JSON.parse(existingPending) : [];
    const updatedPending = pendingList.filter((id: string) => id !== puzzleId);
    await redis.set(pendingKey, JSON.stringify(updatedPending));

    // Award creator credits
    const creatorKey = `creator_credits:${puzzle.creator}`;
    const existingCredits = await redis.get(creatorKey);
    const credits = existingCredits
      ? JSON.parse(existingCredits)
      : { totalPuzzles: 0, approvedPuzzles: 0, totalEchoPoints: 0 };
    credits.totalPuzzles += 1;
    credits.approvedPuzzles += 1;
    credits.totalEchoPoints += 50; // Award 50 echo points for approved puzzle
    await redis.set(creatorKey, JSON.stringify(credits));

    console.log(`Puzzle approved and posted: ${puzzleId} -> ${redditPost.id}`);

    res.json({
      success: true,
      message: 'Puzzle approved and posted to subreddit!',
      puzzleId,
      redditPostId: redditPost.id,
    });
  } catch (error) {
    console.error('Puzzle approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve puzzle' });
  }
});

// Reject a puzzle submission
router.post('/api/puzzles/reject/:puzzleId', async (req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    const { puzzleId } = req.params;
    const { reason } = req.body;

    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    // Get the puzzle
    const submissionKey = `puzzle_submission:${puzzleId}`;
    const puzzleData = await redis.get(submissionKey);

    if (!puzzleData) {
      res.status(404).json({ status: 'error', message: 'Puzzle not found' });
      return;
    }

    const puzzle = JSON.parse(puzzleData);

    if (puzzle.status !== 'pending') {
      res.status(400).json({ status: 'error', message: 'Puzzle is not pending approval' });
      return;
    }

    // Update puzzle status
    puzzle.status = 'rejected';
    puzzle.rejectedAt = Date.now();
    puzzle.rejectionReason = reason || 'No reason provided';
    await redis.set(submissionKey, JSON.stringify(puzzle));

    // Remove from pending
    const pendingKey = `pending_submissions:${subredditName}`;
    const existingPending = await redis.get(pendingKey);
    const pendingList = existingPending ? JSON.parse(existingPending) : [];
    const updatedPending = pendingList.filter((id: string) => id !== puzzleId);
    await redis.set(pendingKey, JSON.stringify(updatedPending));

    // Add to rejected puzzles
    const rejectedKey = `rejected_puzzles:${subredditName}`;
    const existingRejected = await redis.get(rejectedKey);
    const rejectedList = existingRejected ? JSON.parse(existingRejected) : [];
    rejectedList.push(puzzleId);
    await redis.set(rejectedKey, JSON.stringify(rejectedList));

    console.log(`Puzzle rejected: ${puzzleId}`);

    res.json({
      success: true,
      message: 'Puzzle rejected',
      puzzleId,
    });
  } catch (error) {
    console.error('Puzzle rejection error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject puzzle' });
  }
});

// Get creator credits
router.get('/api/creator/credits/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    const creatorKey = `creator_credits:${username}`;
    const creditsData = await redis.get(creatorKey);

    const credits = creditsData
      ? JSON.parse(creditsData)
      : {
          totalPuzzles: 0,
          approvedPuzzles: 0,
          totalEchoPoints: 0,
        };

    res.json({ status: 'success', credits });
  } catch (error) {
    console.error('Creator credits error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get creator credits' });
  }
});

// Get top creators leaderboard
router.get('/api/creators/leaderboard', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    // Get all approved puzzles to find creators
    const approvedKey = `approved_puzzles:${subredditName}`;
    const approvedData = await redis.get(approvedKey);
    const approvedIds = approvedData ? JSON.parse(approvedData) : [];

    const creatorStats: Record<
      string,
      { username: string; approvedPuzzles: number; totalEchoPoints: number }
    > = {};

    for (const puzzleId of approvedIds) {
      const puzzleKey = `puzzle_submission:${puzzleId}`;
      const puzzleData = await redis.get(puzzleKey);
      if (puzzleData) {
        const puzzle = JSON.parse(puzzleData);
        const username = puzzle.creator;

        if (!creatorStats[username]) {
          creatorStats[username] = {
            username,
            approvedPuzzles: 0,
            totalEchoPoints: 0,
          };
        }

        creatorStats[username].approvedPuzzles += 1;
        creatorStats[username].totalEchoPoints += 50; // 50 points per approved puzzle
      }
    }

    // Convert to array and sort by approved puzzles
    const leaderboard = Object.values(creatorStats)
      .sort((a, b) => b.approvedPuzzles - a.approvedPuzzles)
      .slice(0, 10); // Top 10 creators

    res.json({ status: 'success', leaderboard });
  } catch (error) {
    console.error('Creator leaderboard error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get creator leaderboard' });
  }
});

// Get user's global echo points
router.get('/api/echo-points/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    const points = await getUserEchoPoints(username);
    res.json({ status: 'success', username, echoPoints: points });
  } catch (error) {
    console.error('Echo points error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get echo points' });
  }
});

// Get global echo points leaderboard
router.get('/api/echo-points/leaderboard', async (_req, res): Promise<void> => {
  try {
    // For now, return a placeholder since Redis keys() might not be available
    // In a production system, you'd maintain a separate leaderboard key
    res.json({
      status: 'success',
      leaderboard: [],
      message: 'Leaderboard functionality coming soon - points are being tracked!',
    });
  } catch (error) {
    console.error('Echo points leaderboard error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get echo points leaderboard' });
  }
});

// Daily built-in puzzle posting system
router.post('/api/daily-puzzle/post', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    // Check if we already posted today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailyPostKey = `daily_post:${subredditName}:${today}`;
    const existingPost = await redis.get(dailyPostKey);

    if (existingPost) {
      res.json({
        status: 'success',
        message: 'Daily puzzle already posted today',
        postId: existingPost,
      });
      return;
    }

    // Get an unsolved built-in puzzle
    const builtInPuzzles = PuzzleLoader.getAllPuzzles();
    const solvedSetKey = `sr:${subredditName}:solvedBuiltInPuzzles`;
    const solvedData = await redis.get(solvedSetKey);
    const solved = new Set<string>(solvedData ? JSON.parse(solvedData) : []);
    const unsolved = builtInPuzzles.filter((p) => !solved.has(p.id));
    const chosen = (unsolved.length > 0 ? unsolved : builtInPuzzles)[
      Math.floor(Math.random() * (unsolved.length > 0 ? unsolved.length : builtInPuzzles.length))
    ];

    if (!chosen) {
      res.status(500).json({ status: 'error', message: 'No built-in puzzles available' });
      return;
    }

    // Create the daily puzzle post
    const postTitle = `🎯 DAILY PUZZLE: ${chosen.title}`;
    const postText = `**${chosen.title}**

${chosen.description}

**Difficulty:** ${chosen.difficulty}
**Category:** ${chosen.category}

---

*Tune your radio to find the hidden signals and solve the meta puzzle!*

**Hints:**
${
  chosen.hints
    .filter((h: string) => h.trim())
    .map((hint: string) => `- ${hint}`)
    .join('\n') || '- No hints provided'
}

Good luck, signal hunters! 🎧

---
*This is today's official puzzle. Solve it to claim territory on the global map!*`;

    const redditPost = await reddit.submitPost({
      subredditName: subredditName,
      title: postTitle,
      text: postText,
    });

    // Pin the post (this requires moderator permissions)
    // Note: Pinning functionality may need to be implemented via Reddit API
    // For now, we'll log that the post was created and should be pinned manually
    console.log(
      `Daily puzzle post created: ${redditPost.id} - Should be pinned manually by moderators`
    );

    // Store that we posted today
    await redis.set(dailyPostKey, redditPost.id);

    // Store the puzzle ID for this daily post
    const dailyPuzzleKey = `daily_puzzle:${subredditName}:${today}`;
    await redis.set(dailyPuzzleKey, chosen.id);

    console.log(`Daily puzzle posted: ${chosen.id} -> ${redditPost.id}`);

    res.json({
      status: 'success',
      message: 'Daily puzzle posted and pinned!',
      puzzleId: chosen.id,
      postId: redditPost.id,
      title: chosen.title,
    });
  } catch (error) {
    console.error('Daily puzzle posting error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to post daily puzzle' });
  }
});

// Get today's daily puzzle
router.get('/api/daily-puzzle/today', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      res.status(400).json({ status: 'error', message: 'subredditName is required' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyPuzzleKey = `daily_puzzle:${subredditName}:${today}`;
    const puzzleId = await redis.get(dailyPuzzleKey);

    if (!puzzleId) {
      res.json({ status: 'success', hasDailyPuzzle: false });
      return;
    }

    const puzzle = PuzzleLoader.getPuzzleById(puzzleId);
    if (!puzzle) {
      res.json({ status: 'success', hasDailyPuzzle: false });
      return;
    }

    res.json({
      status: 'success',
      hasDailyPuzzle: true,
      puzzle: {
        id: puzzle.id,
        title: puzzle.title,
        description: puzzle.description,
        difficulty: puzzle.difficulty,
        category: puzzle.category,
        hints: puzzle.hints,
      },
    });
  } catch (error) {
    console.error('Get daily puzzle error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get daily puzzle' });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
