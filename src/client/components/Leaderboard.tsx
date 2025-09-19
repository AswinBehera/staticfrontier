import { useGameState } from '../hooks/useGameState';

export const Leaderboard = () => {
  const { gameState } = useGameState();

  return (
    <div className="bg-gray-900 border border-green-400 p-6 rounded">
      <h2 className="text-lg font-bold mb-4 text-green-400">ECHO POINTS LEADERBOARD</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-300 mb-4">
          <div>Your Echo Points: <span className="text-green-400 font-bold">{gameState.userEchoPoints}</span></div>
          <div className="text-xs text-gray-500 mt-1">
            Earn points by solving puzzles after the winner
          </div>
        </div>

        {gameState.winner && (
          <div className="bg-green-400/10 border border-green-400 p-3 rounded">
            <div className="text-green-400 font-bold text-sm">TERRITORY CLAIMED</div>
            <div className="text-xs text-gray-300 mt-1">
              Winner: {gameState.winner}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <div>How Echo Points work:</div>
          <div>• First solver = Territory claim</div>
          <div>• Later solvers = Echo Points</div>
          <div>• Points accumulate over time</div>
        </div>
      </div>
    </div>
  );
};
