import { useState, useEffect, useCallback } from 'react';

type PlotInfo = {
  username: string;
  broadcastTitle: string;
  broadcastId: string;
  metaAnswer: string;
  timestamp: number;
};

type PlotInfoModalProps = {
  isVisible: boolean;
  onClose: () => void;
  row: number;
  col: number;
};

export const PlotInfoModal = ({ isVisible, onClose, row, col }: PlotInfoModalProps) => {
  const [plotInfo, setPlotInfo] = useState<PlotInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlotInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/game/plot/${row}/${col}`);
      if (response.ok) {
        const data = await response.json();
        setPlotInfo(data.plotInfo);
      } else {
        setError('Plot not found');
      }
    } catch (err) {
      setError('Failed to load plot information');
    } finally {
      setLoading(false);
    }
  }, [row, col]);

  useEffect(() => {
    if (isVisible && row !== -1 && col !== -1) {
      void fetchPlotInfo();
    }
  }, [isVisible, row, col, fetchPlotInfo]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black border border-green-300/40 p-6 rounded-sm max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-green-400">PLOT INFORMATION</h2>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="text-center text-green-400 py-4">
            <div className="animate-pulse">Loading plot data...</div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 py-4">
            <div>{error}</div>
          </div>
        )}

        {plotInfo && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-green-300/80 mb-1">COORDINATES</div>
              <div className="text-green-400 font-mono">
                ({row}, {col})
              </div>
            </div>

            <div>
              <div className="text-sm text-green-300/80 mb-1">CLAIMED BY</div>
              <div className="text-green-400 font-mono">u/{plotInfo.username}</div>
            </div>

            <div>
              <div className="text-sm text-green-300/80 mb-1">BROADCAST</div>
              <div className="text-green-400">{plotInfo.broadcastTitle}</div>
            </div>

            <div>
              <div className="text-sm text-green-300/80 mb-1">META ANSWER</div>
              <div className="text-green-400 font-mono bg-green-400/10 p-2 rounded border border-green-400/30">
                {plotInfo.metaAnswer}
              </div>
            </div>

            <div>
              <div className="text-sm text-green-300/80 mb-1">CLAIMED ON</div>
              <div className="text-green-400 text-sm">{formatDate(plotInfo.timestamp)}</div>
            </div>

            <div className="pt-4 border-t border-green-300/20">
              <div className="text-xs text-green-500/60">
                This plot was claimed by solving the meta puzzle for this broadcast.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-400 text-black font-mono text-sm hover:bg-green-300"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
