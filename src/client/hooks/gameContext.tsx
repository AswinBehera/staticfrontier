import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GameState, PhraseFoundResponse, MetaSolveResponse } from '../../shared/types/api';

type GameContextValue = {
  gameState: GameState;
  loading: boolean;
  checkPhrase: (frequency: number, modulation: number) => Promise<PhraseFoundResponse | undefined>;
  solveMeta: (answer: string) => Promise<MetaSolveResponse>;
};

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

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
    void initGame();
  }, []);

  const checkPhrase = useCallback(async (frequency: number, modulation: number) => {
    try {
      const response = await fetch('/api/game/phrase-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency, modulation }),
      });
      if (response.ok) {
        const result: PhraseFoundResponse = await response.json();
        if (result.success && result.phrase) {
          setGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              foundPhrases: prev.foundPhrases.includes(result.phrase!)
                ? prev.foundPhrases
                : [...prev.foundPhrases, result.phrase!],
            };
          });
        }
        return result;
      }
    } catch (error) {
      console.error('Failed to check phrase:', error);
    }
    return undefined;
  }, []);

  const solveMeta = useCallback(async (answer: string) => {
    try {
      const response = await fetch('/api/game/meta-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (response.ok) {
        const result: MetaSolveResponse = await response.json();
        if (result.success) {
          setGameState((prev) => {
            if (!prev) return prev;
            const updatedState = {
              ...prev,
              isMetaSolved: true,
              userEchoPoints: result.echoPoints || prev.userEchoPoints,
            };
            if (result.isWinner) {
              updatedState.winner = 'You';
            } else if (prev.winner) {
              updatedState.winner = prev.winner;
            }
            // Update the map with the new plot
            if (result.asciiMap) {
              updatedState.asciiMap = result.asciiMap;
            }
            // Update user echo points
            if (result.echoPoints !== undefined) {
              updatedState.userEchoPoints = result.echoPoints;
            }
            return updatedState;
          });
        }
        return result;
      }
      return {
        success: false,
        isWinner: false,
        message: 'Failed to submit answer',
      } as MetaSolveResponse;
    } catch (error) {
      console.error('Failed to solve meta:', error);
      return {
        success: false,
        isWinner: false,
        message: 'Error submitting answer',
      } as MetaSolveResponse;
    }
  }, []);

  const value = useMemo(
    () => ({
      gameState: gameState!,
      loading,
      checkPhrase,
      solveMeta,
    }),
    [gameState, loading, checkPhrase, solveMeta]
  );

  if (!gameState) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-4">STATIC FRONTIER</div>
          <div className="text-sm">Tuning into the signal...</div>
        </div>
      </div>
    );
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
