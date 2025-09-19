import { useState } from 'react';
import { RadioDial } from './components/RadioDial';
import { PhraseDisplay } from './components/PhraseDisplay';
import { MetaSolveForm } from './components/MetaSolveForm';
import { AsciiMap } from './components/AsciiMap';
import { Leaderboard } from './components/Leaderboard';
import { HelpModal } from './components/HelpModal';
import { AsciiIntro } from './components/AsciiIntro';
import { PuzzleSubmissionForm } from './components/PuzzleSubmissionForm';
import EchoPointsLeaderboard from './components/EchoPointsLeaderboard';
import { GameProvider, useGame } from './hooks/gameContext';
import { useSfx } from './hooks/useSfx';

const AppInner = () => {
  const [activeTab, setActiveTab] = useState<'radio' | 'map' | 'create' | 'leaderboard'>('radio');
  const { gameState } = useGame();
  const { toggleMute, isMuted } = useSfx();
  const [showHelp, setShowHelp] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {showIntro && <AsciiIntro onComplete={() => setShowIntro(false)} />}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      {/* Header */}
      <div className="border-b border-green-400 p-4">
        <div className="relative">
          <h1 className="text-2xl font-bold text-center text-green-400">STATIC FRONTIER</h1>
          <p className="text-center text-sm text-green-300 mt-1">{gameState.broadcast.title}</p>
          <div className="absolute right-0 top-0 flex space-x-1">
            <button
              className="h-7 w-7 border border-green-400/60 rounded-sm text-green-300 text-sm hover:bg-green-400/10 hover:border-green-400 hover:text-green-400 transition-all duration-200 btn-hover"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              onClick={toggleMute}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              className="h-7 w-7 border border-green-400/60 rounded-sm text-green-300 text-sm hover:bg-green-400/10 hover:border-green-400 hover:text-green-400 transition-all duration-200 btn-hover"
              aria-label="Help"
              onClick={() => setShowHelp(true)}
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-green-400">
        <button
          className={`px-6 py-3 text-sm font-mono transition-all duration-200 ${
            activeTab === 'radio'
              ? 'bg-green-400 text-black shadow-sm'
              : 'text-green-400 hover:bg-green-400/10 hover:text-green-300'
          }`}
          onClick={() => setActiveTab('radio')}
        >
          RADIO TUNING
        </button>
        <button
          className={`px-6 py-3 text-sm font-mono transition-all duration-200 ${
            activeTab === 'map'
              ? 'bg-green-400 text-black shadow-sm'
              : 'text-green-400 hover:bg-green-400/10 hover:text-green-300'
          }`}
          onClick={() => setActiveTab('map')}
        >
          ASCII MAP
        </button>
        <button
          className={`px-6 py-3 text-sm font-mono transition-all duration-200 ${
            activeTab === 'create'
              ? 'bg-green-400 text-black shadow-sm'
              : 'text-green-400 hover:bg-green-400/10 hover:text-green-300'
          }`}
          onClick={() => setActiveTab('create')}
        >
          CREATE PUZZLE
        </button>
        <button
          className={`px-6 py-3 text-sm font-mono transition-all duration-200 ${
            activeTab === 'leaderboard'
              ? 'bg-green-400 text-black shadow-sm'
              : 'text-green-400 hover:bg-green-400/10 hover:text-green-300'
          }`}
          onClick={() => setActiveTab('leaderboard')}
        >
          ECHO POINTS
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'radio' && (
            <div className="space-y-6 animate-fadeIn">
              <RadioDial />
              <PhraseDisplay />
              <MetaSolveForm />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-6 animate-fadeIn">
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

          {activeTab === 'create' && (
            <div className="animate-fadeIn">
              <PuzzleSubmissionForm />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="animate-fadeIn">
              <EchoPointsLeaderboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
};
