import React, { useState, useEffect } from 'react';
import { useGame } from '../hooks/gameContext';

type LeaderboardEntry = {
  username: string;
  points: number;
  rank: number;
};

const EchoPointsLeaderboard: React.FC = () => {
  const { gameState } = useGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async (): Promise<void> => {
    try {
      const response = await fetch('/api/echo-points/leaderboard');
      const data = await response.json();

      if (data.status === 'success') {
        setLeaderboard(data.leaderboard || []);
      } else {
        setError(data.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-green-400">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Echo Points Explanation */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-400 mb-3">🎯 How to Earn Echo Points</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Solving already solved puzzles:</span>
            <span className="text-green-400 font-mono">+5 points</span>
          </div>
          <div className="flex justify-between">
            <span>Submitting puzzles:</span>
            <span className="text-green-400 font-mono">+5 points</span>
          </div>
          <div className="flex justify-between">
            <span>Solving puzzles (first time):</span>
            <span className="text-green-400 font-mono">+50 points</span>
          </div>
          <div className="flex justify-between">
            <span>Solving puzzles (already solved):</span>
            <span className="text-green-400 font-mono">+5 points</span>
          </div>
        </div>
      </div>

      {/* Current User Points */}
      <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-400 mb-2">Your Echo Points</h3>
        <div className="text-2xl font-mono text-green-300">
          {gameState?.userEchoPoints?.toLocaleString() || 0}
        </div>
        {gameState?.username && (
          <div className="text-sm text-gray-400 mt-1">User: {gameState.username}</div>
        )}
      </div>

      {/* Global Leaderboard */}
      <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-400 mb-4">🏆 Global Leaderboard</h3>

        {leaderboard.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No leaderboard data available yet</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.username}
                className={`flex justify-between items-center p-3 rounded ${
                  index === 0
                    ? 'bg-yellow-900/30 border border-yellow-600'
                    : index === 1
                      ? 'bg-gray-700/30 border border-gray-500'
                      : index === 2
                        ? 'bg-orange-900/30 border border-orange-600'
                        : 'bg-gray-800/20 border border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold">
                    {index === 0
                      ? '🥇'
                      : index === 1
                        ? '🥈'
                        : index === 2
                          ? '🥉'
                          : `#${entry.rank}`}
                  </span>
                  <span className="font-mono text-green-300">{entry.username}</span>
                </div>
                <span className="text-green-400 font-mono text-lg">
                  {entry.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={() => {
          setLoading(true);
          void fetchLeaderboard();
        }}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all duration-200 btn-hover"
      >
        🔄 Refresh Leaderboard
      </button>
    </div>
  );
};

export default EchoPointsLeaderboard;
