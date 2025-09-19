import { useGameState } from '../hooks/useGameState';

export const AsciiMap = () => {
  const { gameState } = useGameState();

  const renderMap = () => {
    if (!gameState.asciiMap || gameState.asciiMap.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="text-2xl mb-2">████████</div>
          <div className="text-sm">Map not available</div>
        </div>
      );
    }

    return (
      <div className="font-mono text-xs leading-tight">
        {gameState.asciiMap.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <span
                key={`${rowIndex}-${colIndex}`}
                className={`w-4 h-4 inline-block text-center ${
                  cell === '.' || cell === ' '
                    ? 'text-gray-600'
                    : cell === 'W'
                    ? 'text-green-400 bg-green-400/20'
                    : 'text-yellow-400 bg-yellow-400/20'
                }`}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-green-400 p-6 rounded">
      <h2 className="text-lg font-bold mb-4 text-green-400">ASCII TERRITORY MAP</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-300 mb-4">
          <div>Grid: 10x10 | Status: {gameState.winner ? 'CLAIMED' : 'AVAILABLE'}</div>
          {gameState.winner && (
            <div className="text-green-400 mt-1">
              Winner: {gameState.winner}
            </div>
          )}
        </div>

        <div className="bg-black border border-green-400 p-4 rounded overflow-x-auto relative">
          {renderMap()}
          {/* Grid overlay for better visibility */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-10 grid-rows-10 h-full w-full opacity-10">
              {Array.from({ length: 100 }, (_, i) => (
                <div key={i} className="border border-green-400/20"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <div>Legend:</div>
          <div>• <span className="text-gray-600">.</span> = Unclaimed territory</div>
          <div>• <span className="text-green-400">W</span> = Winner's territory</div>
          <div>• <span className="text-yellow-400">E</span> = Echo Points territory</div>
        </div>
      </div>
    </div>
  );
};
