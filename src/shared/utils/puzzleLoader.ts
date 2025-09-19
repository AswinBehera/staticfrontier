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
    return this.data.puzzles.find(puzzle => puzzle.id === id) || null;
  }

  /**
   * Get puzzles by category
   */
  static getPuzzlesByCategory(category: string): Puzzle[] {
    return this.data.puzzles.filter(puzzle => puzzle.category === category);
  }

  /**
   * Get puzzles by difficulty
   */
  static getPuzzlesByDifficulty(difficulty: string): Puzzle[] {
    return this.data.puzzles.filter(puzzle => puzzle.difficulty === difficulty);
  }

  /**
   * Get a random puzzle
   */
  static getRandomPuzzle(): Puzzle {
    const puzzles = this.data.puzzles;
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    return puzzles[randomIndex];
  }

  /**
   * Get a random puzzle by difficulty
   */
  static getRandomPuzzleByDifficulty(difficulty: string): Puzzle | null {
    const puzzles = this.getPuzzlesByDifficulty(difficulty);
    if (puzzles.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    return puzzles[randomIndex];
  }

  /**
   * Convert a Puzzle to a Broadcast format
   */
  static puzzleToBroadcast(puzzle: Puzzle): Broadcast {
    return {
      broadcastId: puzzle.id,
      title: puzzle.title,
      metaAnswer: puzzle.metaAnswer,
      phrases: puzzle.phrases
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
    return this.data.categories.find(category => category.id === id) || null;
  }

  /**
   * Get difficulty by ID
   */
  static getDifficultyById(id: string): PuzzleDifficulty | null {
    return this.data.difficulties.find(difficulty => difficulty.id === id) || null;
  }

  /**
   * Search puzzles by title or description
   */
  static searchPuzzles(query: string): Puzzle[] {
    const lowercaseQuery = query.toLowerCase();
    return this.data.puzzles.filter(puzzle => 
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
      byDifficulty: {} as Record<string, number>
    };

    this.data.puzzles.forEach(puzzle => {
      stats.byCategory[puzzle.category] = (stats.byCategory[puzzle.category] || 0) + 1;
      stats.byDifficulty[puzzle.difficulty] = (stats.byDifficulty[puzzle.difficulty] || 0) + 1;
    });

    return stats;
  }
}
