import type { Broadcast, Phrase } from '../types/api';
import puzzlesData from '../data/puzzles.json';

export type Puzzle = {
  id: string;
  title: string;
  description: string;
  metaAnswer: string;
  hints: string[];
  phrases: Phrase[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
};

export type PuzzleCategory = {
  id: string;
  name: string;
  description: string;
};

export type PuzzleDifficulty = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type PuzzlesData = {
  puzzles: Puzzle[];
  categories: PuzzleCategory[];
  difficulties: PuzzleDifficulty[];
};

export class PuzzleLoader {
  private static data: PuzzlesData = puzzlesData as PuzzlesData;

  /**
   * Get all available puzzles
   */
  static getAllPuzzles(): Puzzle[] {
    return this.data.puzzles;
  }

  /**
   * Get a specific puzzle by ID
   */
  static getPuzzleById(id: string): Puzzle | null {
    return this.data.puzzles.find((puzzle) => puzzle.id === id) || null;
  }

  /**
   * Get puzzles by category
   */
  static getPuzzlesByCategory(category: string): Puzzle[] {
    return this.data.puzzles.filter((puzzle) => puzzle.category === category);
  }

  /**
   * Get puzzles by difficulty
   */
  static getPuzzlesByDifficulty(difficulty: string): Puzzle[] {
    return this.data.puzzles.filter((puzzle) => puzzle.difficulty === difficulty);
  }

  /**
   * Get a random puzzle
   */
  static getRandomPuzzle(): Puzzle {
    const puzzles = this.data.puzzles;
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    const puzzle = puzzles[randomIndex];
    if (!puzzle) {
      throw new Error('No puzzles available');
    }
    return puzzle;
  }

  /**
   * Get a random puzzle by difficulty
   */
  static getRandomPuzzleByDifficulty(difficulty: string): Puzzle | null {
    const puzzles = this.getPuzzlesByDifficulty(difficulty);
    if (puzzles.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * puzzles.length);
    const puzzle = puzzles[randomIndex];
    return puzzle || null;
  }

  /**
   * Convert a Puzzle to a Broadcast format
   */
  static puzzleToBroadcast(puzzle: Puzzle): Broadcast {
    return {
      broadcastId: puzzle.id,
      title: puzzle.title,
      metaAnswer: puzzle.metaAnswer,
      phrases: puzzle.phrases,
    };
  }

  /**
   * Get all categories
   */
  static getCategories(): PuzzleCategory[] {
    return this.data.categories;
  }

  /**
   * Get all difficulties
   */
  static getDifficulties(): PuzzleDifficulty[] {
    return this.data.difficulties;
  }

  /**
   * Get category by ID
   */
  static getCategoryById(id: string): PuzzleCategory | null {
    return this.data.categories.find((category) => category.id === id) || null;
  }

  /**
   * Get difficulty by ID
   */
  static getDifficultyById(id: string): PuzzleDifficulty | null {
    return this.data.difficulties.find((difficulty) => difficulty.id === id) || null;
  }

  /**
   * Search puzzles by title or description
   */
  static searchPuzzles(query: string): Puzzle[] {
    const lowercaseQuery = query.toLowerCase();
    return this.data.puzzles.filter(
      (puzzle) =>
        puzzle.title.toLowerCase().includes(lowercaseQuery) ||
        puzzle.description.toLowerCase().includes(lowercaseQuery) ||
        puzzle.metaAnswer.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get puzzle statistics
   */
  static getPuzzleStats(): {
    total: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
  } {
    const stats = {
      total: this.data.puzzles.length,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
    };

    this.data.puzzles.forEach((puzzle) => {
      stats.byCategory[puzzle.category] = (stats.byCategory[puzzle.category] || 0) + 1;
      stats.byDifficulty[puzzle.difficulty] = (stats.byDifficulty[puzzle.difficulty] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get all puzzles including user-submitted ones from Redis
   * This method should be called from the server context where Redis is available
   */
  static async getAllPuzzlesWithUserSubmissions(
    redis: { get: (key: string) => Promise<string | undefined> },
    subredditName: string
  ): Promise<Puzzle[]> {
    const builtInPuzzles = this.data.puzzles;

    try {
      // Get user-submitted puzzles from Redis
      const approvedKey = `approved_puzzles:${subredditName}`;
      const approvedData = await redis.get(approvedKey);
      const approvedIds = approvedData ? JSON.parse(approvedData) : [];

      const userPuzzles: Puzzle[] = [];
      for (const puzzleId of approvedIds) {
        const puzzleKey = `puzzle_submission:${puzzleId}`;
        const puzzleData = await redis.get(puzzleKey);
        if (puzzleData) {
          const userPuzzle = JSON.parse(puzzleData);
          // Convert user puzzle format to Puzzle format
          const puzzle: Puzzle = {
            id: userPuzzle.id,
            title: userPuzzle.title,
            description: userPuzzle.description,
            metaAnswer: userPuzzle.metaAnswer,
            hints: userPuzzle.hints,
            phrases: userPuzzle.phrases,
            difficulty: userPuzzle.difficulty,
            category: userPuzzle.category,
          };
          userPuzzles.push(puzzle);
        }
      }

      // Combine built-in and user puzzles
      return [...builtInPuzzles, ...userPuzzles];
    } catch (error) {
      // Fallback to built-in puzzles only
      return builtInPuzzles;
    }
  }
}
