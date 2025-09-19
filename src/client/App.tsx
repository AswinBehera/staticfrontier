import { useState } from 'react';
import { RadioDial } from './components/RadioDial';
import { PhraseDisplay } from './components/PhraseDisplay';
import { MetaSolveForm } from './components/MetaSolveForm';
import { AsciiMap } from './components/AsciiMap';
import { Leaderboard } from './components/Leaderboard';
import { useGameState } from './hooks/useGameState';

export const App = () => {
  const [activeTab, setActiveTab] = useState<'radio' | 'map'>('radio');
  const { gameState, loading } = useGameState();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-4">STATIC FRONTIER</div>
          <div className="text-sm">Tuning into the signal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <div className="border-b border-green-400 p-4">
        <h1 className="text-2xl font-bold text-center text-green-400">
          STATIC FRONTIER
        </h1>
        <p className="text-center text-sm text-green-300 mt-1">
          {gameState.broadcast.title}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-green-400">
        <button
          className={`px-6 py-3 text-sm font-mono ${
            activeTab === 'radio'
              ? 'bg-green-400 text-black'
              : 'text-green-400 hover:bg-green-400/10'
          }`}
          onClick={() => setActiveTab('radio')}
        >
          RADIO TUNING
        </button>
        <button
          className={`px-6 py-3 text-sm font-mono ${
            activeTab === 'map'
              ? 'bg-green-400 text-black'
              : 'text-green-400 hover:bg-green-400/10'
          }`}
          onClick={() => setActiveTab('map')}
        >
          ASCII MAP
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'radio' && (
          <div className="space-y-6">
            <RadioDial />
            <PhraseDisplay />
            <MetaSolveForm />
          </div>
        )}
        
        {activeTab === 'map' && (
          <div className="space-y-6">
            <AsciiMap />
            <Leaderboard />
            {gameState.winner && (
              <div className="text-center text-green-400">
                <div className="text-lg font-bold">TERRITORY CLAIMED</div>
                <div className="text-sm">Winner: {gameState.winner}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
