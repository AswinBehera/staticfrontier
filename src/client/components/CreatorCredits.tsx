import React, { useState } from 'react';

type CreatorCreditsData = {
  totalPuzzles: number;
  approvedPuzzles: number;
  totalEchoPoints: number;
};

export const CreatorCredits = () => {
  const [credits, setCredits] = useState<CreatorCreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  const fetchCredits = async (user: string) => {
    if (!user.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/creator/credits/${user}`);
      const data = await response.json();
      if (data.status === 'success') {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Failed to fetch creator credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchCredits(username);
  };

  return (
    <div className="bg-black border border-green-300/40 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-green-300 mb-4">CREATOR CREDITS</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username..."
            className="flex-1 px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300"
          />
          <button
            type="submit"
            className="bg-green-400 text-black px-4 py-2 font-mono text-sm hover:bg-green-300 transition-all duration-200"
          >
            LOOKUP
          </button>
        </div>
      </form>

      {loading && <div className="text-center text-green-300">Loading credits...</div>}

      {credits && !loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border border-green-400/30 rounded">
              <div className="text-2xl font-bold text-green-400">{credits.totalPuzzles}</div>
              <div className="text-xs text-green-500/80">Total Puzzles</div>
            </div>
            <div className="text-center p-3 border border-green-400/30 rounded">
              <div className="text-2xl font-bold text-green-400">{credits.approvedPuzzles}</div>
              <div className="text-xs text-green-500/80">Approved</div>
            </div>
            <div className="text-center p-3 border border-green-400/30 rounded">
              <div className="text-2xl font-bold text-green-400">{credits.totalEchoPoints}</div>
              <div className="text-xs text-green-500/80">Echo Points</div>
            </div>
          </div>

          <div className="text-sm text-green-400/80">
            <div>• Earn 50 Echo Points for each approved puzzle</div>
            <div>• Approved puzzles are posted to the subreddit</div>
            <div>• Build your reputation as a puzzle creator!</div>
          </div>
        </div>
      )}

      {!credits && !loading && username && (
        <div className="text-center text-green-400/60 py-4">No credits found for u/{username}</div>
      )}
    </div>
  );
};
