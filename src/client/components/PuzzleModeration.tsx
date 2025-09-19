import { useState, useEffect } from 'react';
import { CreatorCredits } from './CreatorCredits';

type PendingPuzzle = {
  id: string;
  title: string;
  description: string;
  phrases: Array<{
    text: string;
    frequency: number;
    modulation: number;
  }>;
  metaAnswer: string;
  difficulty: string;
  category: string;
  hints: string[];
  creator: string;
  createdAt: number;
  status: string;
};

type CreatorStats = {
  username: string;
  approvedPuzzles: number;
  totalEchoPoints: number;
};

export const PuzzleModeration = () => {
  const [pendingPuzzles, setPendingPuzzles] = useState<PendingPuzzle[]>([]);
  const [creatorLeaderboard, setCreatorLeaderboard] = useState<CreatorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState<PendingPuzzle | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingPuzzles = async () => {
    try {
      const response = await fetch('/api/puzzles/pending');
      const data = await response.json();
      if (data.status === 'success') {
        setPendingPuzzles(data.puzzles);
      }
    } catch (error) {
      console.error('Failed to fetch pending puzzles:', error);
    }
  };

  const fetchCreatorLeaderboard = async () => {
    try {
      const response = await fetch('/api/creators/leaderboard');
      const data = await response.json();
      if (data.status === 'success') {
        setCreatorLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch creator leaderboard:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingPuzzles(), fetchCreatorLeaderboard()]);
      setLoading(false);
    };
    void loadData();
  }, []);

  const approvePuzzle = async (puzzleId: string) => {
    try {
      const response = await fetch(`/api/puzzles/approve/${puzzleId}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Puzzle approved and posted! Post ID: ${data.redditPostId}`);
        await fetchPendingPuzzles();
        await fetchCreatorLeaderboard();
        setSelectedPuzzle(null);
      } else {
        setMessage(`❌ Failed to approve puzzle: ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Error approving puzzle. Please try again.');
    }
  };

  const rejectPuzzle = async (puzzleId: string) => {
    if (!rejectionReason.trim()) {
      setMessage('❌ Please provide a reason for rejection.');
      return;
    }

    try {
      const response = await fetch(`/api/puzzles/reject/${puzzleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('✅ Puzzle rejected.');
        await fetchPendingPuzzles();
        setSelectedPuzzle(null);
        setRejectionReason('');
      } else {
        setMessage(`❌ Failed to reject puzzle: ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Error rejecting puzzle. Please try again.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-black border border-green-300/40 p-6 rounded-sm">
        <div className="text-center text-green-300">Loading moderation data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black border border-green-300/40 p-4 rounded-sm">
        <h2 className="text-lg font-bold text-green-300 mb-2">PUZZLE MODERATION</h2>
        <p className="text-sm text-green-400/80">Review and approve user-submitted puzzles</p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`text-center text-sm p-3 rounded ${
            message.includes('✅') ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
          }`}
        >
          {message}
        </div>
      )}

      {/* Pending Puzzles */}
      <div className="bg-black border border-green-300/40 p-4 rounded-sm">
        <h3 className="text-md font-bold text-green-300 mb-4">
          PENDING REVIEW ({pendingPuzzles.length})
        </h3>

        {pendingPuzzles.length === 0 ? (
          <div className="text-center text-green-400/60 py-4">No puzzles pending review</div>
        ) : (
          <div className="space-y-3">
            {pendingPuzzles.map((puzzle) => (
              <div
                key={puzzle.id}
                className="border border-green-400/30 p-3 rounded cursor-pointer hover:bg-green-400/5"
                onClick={() => setSelectedPuzzle(puzzle)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-green-300">{puzzle.title}</h4>
                    <p className="text-sm text-green-400/80 mt-1">
                      by u/{puzzle.creator} • {puzzle.difficulty} • {puzzle.category}
                    </p>
                    <p className="text-xs text-green-500/60 mt-1">
                      {puzzle.phrases.length} phrases • {formatDate(puzzle.createdAt)}
                    </p>
                  </div>
                  <div className="text-xs text-green-400/60">{puzzle.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creator Leaderboard */}
      <div className="bg-black border border-green-300/40 p-4 rounded-sm">
        <h3 className="text-md font-bold text-green-300 mb-4">TOP CREATORS</h3>

        {creatorLeaderboard.length === 0 ? (
          <div className="text-center text-green-400/60 py-4">No creators yet</div>
        ) : (
          <div className="space-y-2">
            {creatorLeaderboard.map((creator, index) => (
              <div
                key={creator.username}
                className="flex justify-between items-center p-2 border border-green-400/20 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold">#{index + 1}</span>
                  <span className="text-green-300">u/{creator.username}</span>
                </div>
                <div className="text-sm text-green-400/80">
                  {creator.approvedPuzzles} puzzles • {creator.totalEchoPoints} points
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creator Credits Lookup */}
      <CreatorCredits />

      {/* Puzzle Detail Modal */}
      {selectedPuzzle && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-green-400 p-6 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-green-400">PUZZLE REVIEW</h3>
              <button
                onClick={() => setSelectedPuzzle(null)}
                className="text-green-400 hover:text-green-300 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-green-300">{selectedPuzzle.title}</h4>
                <p className="text-sm text-green-400/80 mt-1">
                  by u/{selectedPuzzle.creator} • {selectedPuzzle.difficulty} •{' '}
                  {selectedPuzzle.category}
                </p>
                <p className="text-xs text-green-500/60 mt-1">
                  Submitted: {formatDate(selectedPuzzle.createdAt)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-mono text-green-300 mb-1">DESCRIPTION</label>
                <p className="text-green-400/80 text-sm">{selectedPuzzle.description}</p>
              </div>

              <div>
                <label className="block text-sm font-mono text-green-300 mb-2">PHRASES</label>
                <div className="space-y-2">
                  {selectedPuzzle.phrases.map((phrase, index) => (
                    <div key={index} className="p-2 border border-green-400/30 rounded text-sm">
                      <div className="text-green-300 font-mono">
                        "{phrase.text}" at F:{phrase.frequency.toFixed(1)}, M:
                        {phrase.modulation.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-green-300 mb-1">META ANSWER</label>
                <p className="text-green-400/80 text-sm">{selectedPuzzle.metaAnswer}</p>
              </div>

              {selectedPuzzle.hints.length > 0 && selectedPuzzle.hints[0]?.trim() && (
                <div>
                  <label className="block text-sm font-mono text-green-300 mb-1">HINTS</label>
                  <ul className="text-green-400/80 text-sm space-y-1">
                    {selectedPuzzle.hints
                      .filter((h) => h.trim())
                      .map((hint, index) => (
                        <li key={index}>• {hint}</li>
                      ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => void approvePuzzle(selectedPuzzle.id)}
                  className="flex-1 bg-green-400 text-black py-2 px-4 font-mono text-sm hover:bg-green-300 transition-all duration-200"
                >
                  APPROVE & POST
                </button>
                <button
                  onClick={() => void rejectPuzzle(selectedPuzzle.id)}
                  className="flex-1 bg-red-400 text-white py-2 px-4 font-mono text-sm hover:bg-red-300 transition-all duration-200"
                >
                  REJECT
                </button>
              </div>

              <div>
                <label className="block text-sm font-mono text-green-300 mb-1">
                  REJECTION REASON (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-red-400 text-red-400 font-mono focus:outline-none focus:border-red-300 h-20 resize-none"
                  placeholder="Explain why this puzzle is being rejected..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
