import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../hooks/gameContext';
import { PlotInfoModal } from './PlotInfoModal';

const NOISE = '█▓▒░#@%&*+=-_/\\|<>~^:;.,';

export const AsciiMap = () => {
  const { gameState } = useGame();
  const baseGrid = gameState.asciiMap;
  const [displayGrid, setDisplayGrid] = useState<string[][]>(baseGrid);
  const [selectedPlot, setSelectedPlot] = useState<{ row: number; col: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayGrid(baseGrid);
  }, [baseGrid]);

  useEffect(() => {
    const rows = baseGrid.length;
    const cols = baseGrid[0]?.length ?? 0;
    const start = performance.now();

    const isClaimed = (ch: string) => ch !== '.' && ch !== ' ';

    const tick = (t: number) => {
      const elapsed = (t - start) / 1000; // seconds
      const newGrid: string[][] = baseGrid.map((row) => row.slice());
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = baseGrid[r]?.[c];
          if (!ch || isClaimed(ch)) continue;
          // sine wave phase across grid
          const phase = Math.sin((r + c) * 0.6 + elapsed * 2.2);
          const idx = Math.floor(((phase + 1) / 2) * (NOISE.length - 1));
          const row = newGrid[r];
          if (row && row[c] !== undefined) {
            const noiseChar = NOISE[idx];
            if (noiseChar) {
              row[c] = noiseChar;
            }
          }
        }
      }
      setDisplayGrid(newGrid);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [baseGrid]);

  const handleCellClick = (row: number, col: number, isClaimed: boolean) => {
    if (isClaimed) {
      setSelectedPlot({ row, col });
      setShowModal(true);
    }
  };

  const renderMap = useMemo(() => {
    if (!displayGrid || displayGrid.length === 0) {
      return (
        <div className="text-center text-green-700 py-8">
          <div className="text-2xl mb-2">████████</div>
          <div className="text-xs">Map not available</div>
        </div>
      );
    }

    return (
      <div className="font-mono h-full w-full">
        {displayGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex" style={{ height: `${100 / displayGrid.length}%` }}>
            {row.map((cell, colIndex) => {
              const original = baseGrid[rowIndex]?.[colIndex] || '.';
              const claimed = original !== '.' && original !== ' ';
              return (
                <span
                  key={`${rowIndex}-${colIndex}`}
                  className={`flex-1 h-full inline-flex items-center justify-center ${
                    claimed
                      ? 'text-green-300 bg-green-300/10 cursor-pointer hover:bg-green-300/20'
                      : 'text-transparent'
                  }`}
                  style={
                    claimed
                      ? undefined
                      : {
                          backgroundImage: 'linear-gradient(45deg, #8b5cf6, #a855f7, #dc2626)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                        }
                  }
                  onClick={() => handleCellClick(rowIndex, colIndex, claimed)}
                >
                  {claimed ? original : cell}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  }, [displayGrid, baseGrid]);

  return (
    <div className="bg-black border border-green-300/40 p-0 rounded-sm overflow-hidden">
      <div className="p-3">
        <h2 className="text-sm tracking-widest font-bold mb-3 text-green-300">
          ASCII TERRITORY MAP
        </h2>
      </div>
      <div className="px-3 pb-3">
        <div
          className="bg-black border border-green-300/40 rounded-sm overflow-hidden"
          style={{ height: 280 }}
        >
          {renderMap}
        </div>

        <div className="text-[10px] text-green-500/60 space-y-1 mt-3">
          <div>Legend:</div>
          <div>
            • <span className="text-green-600">.</span> = Unclaimed territory
          </div>
          <div>
            • <span className="text-green-300">[A-Z]</span> = Claimed by user (initial)
          </div>
        </div>
      </div>

      <PlotInfoModal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        row={selectedPlot?.row ?? -1}
        col={selectedPlot?.col ?? -1}
      />
    </div>
  );
};
