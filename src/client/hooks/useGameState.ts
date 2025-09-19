import { useState, useEffect, useCallback } from 'react';
import type { GameState, PhraseFoundResponse, MetaSolveResponse } from '../../shared/types/api';

const INITIAL_GAME_STATE: GameState = {
  broadcast: {
    broadcastId: 'broadcast-001',
    title: "The Exile's Lantern",
    metaAnswer: 'Statue of Liberty',
    phrases: [
      {
        frequency: 44.2,
        modulation: 18.5,
        text: 'a gift from across the sea, bones of copper, skin of green'
      },
      {
        frequency: 63.8,
        modulation: 21.1,
        text: 'she holds fire in her hand, but it never burns'
      },
      {
        frequency: 79.7,
        modulation: 37.4,
        text: 'the exiles\' first vision, a sentinel of arrival'
      },
      {
        frequency: 82.0,
        modulation: 42.0,
        text: 'coordinates 40°41′N 74°2′W, brighter than any star in our charts'
      }
    ]
  },
  foundPhrases: [],
  isMetaSolved: false,
  asciiMap: Array(10).fill(null).map(() => Array(10).fill('.')),
  userEchoPoints: 0
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [loading, setLoading] = useState(true);

  // Initialize game state
  useEffect(() => {
    const initGame = async () => {
      try {
        const response = await fetch('/api/game/init');
        if (response.ok) {
          const data = await response.json();
          setGameState(data);
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, []);

  const checkPhrase = useCallback(async (frequency: number, modulation: number) => {
    try {
      const response = await fetch('/api/game/phrase-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency, modulation })
      });

      if (response.ok) {
        const result: PhraseFoundResponse = await response.json();
        if (result.success && result.phrase) {
          setGameState(prev => ({
            ...prev,
            foundPhrases: [...prev.foundPhrases, result.phrase!]
          }));
        }
      }
    } catch (error) {
      console.error('Failed to check phrase:', error);
    }
  }, []);

  const solveMeta = useCallback(async (answer: string) => {
    try {
      const response = await fetch('/api/game/meta-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });

      if (response.ok) {
        const result: MetaSolveResponse = await response.json();
        if (result.success) {
          setGameState(prev => ({
            ...prev,
            isMetaSolved: true,
            winner: result.isWinner ? 'You' : prev.winner,
            userEchoPoints: result.echoPoints || prev.userEchoPoints
          }));
        }
        return result;
      }
      return { success: false, isWinner: false, message: 'Failed to submit answer' };
    } catch (error) {
      console.error('Failed to solve meta:', error);
      return { success: false, isWinner: false, message: 'Error submitting answer' };
    }
  }, []);

  return {
    gameState,
    loading,
    checkPhrase,
    solveMeta
  };
};
