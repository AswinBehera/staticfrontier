import { useState, useEffect } from 'react';
import { useGame } from '../hooks/gameContext';
import { SignalAnimation } from './SignalAnimation';

export const PhraseDisplay = () => {
  const { gameState } = useGame();
  const [displayedPhrases, setDisplayedPhrases] = useState<string[]>([]);
  const [flickeringPhrase, setFlickeringPhrase] = useState<string | null>(null);
  const [flickerText, setFlickerText] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  // ASCII characters for flicker effect
  const asciiChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';

  useEffect(() => {
    // Start flicker when new phrase arrives
    if (gameState.foundPhrases.length > displayedPhrases.length) {
      const newPhrase = gameState.foundPhrases[gameState.foundPhrases.length - 1];
      if (!newPhrase) return;

      setShowAnimation(true);
      setTimeout(() => {
        setFlickeringPhrase(newPhrase);
        setFlickerText(newPhrase);
        let iterations = 0;
        const maxIterations = 30;
        const interval = setInterval(() => {
          setFlickerText((prev) =>
            prev
              .split('')
              .map((_, index) => {
                if (index < iterations) return newPhrase[index];
                return asciiChars[Math.floor(Math.random() * asciiChars.length)];
              })
              .join('')
          );
          iterations++;
          if (iterations >= maxIterations) {
            clearInterval(interval);
            setFlickerText(newPhrase);
            setFlickeringPhrase(null);
            setDisplayedPhrases(gameState.foundPhrases);
          }
        }, 50);
      }, 600);
    } else if (gameState.foundPhrases.length < displayedPhrases.length) {
      // reset if state shrinks (unlikely)
      setDisplayedPhrases(gameState.foundPhrases);
    }
  }, [gameState.foundPhrases, displayedPhrases.length]);

  return (
    <>
      <SignalAnimation isVisible={showAnimation} onComplete={() => setShowAnimation(false)} />
      <div className="bg-gray-900 border border-green-400 p-6 rounded">
        <h2 className="text-lg font-bold mb-4 text-green-400">SIGNAL DECODED</h2>

        <div className="space-y-4">
          {gameState.foundPhrases.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">████████</div>
              <div className="text-sm">No signals detected</div>
            </div>
          ) : (
            <div className="space-y-3">
              {gameState.foundPhrases.map((phrase, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded font-mono text-sm ${
                    flickeringPhrase === phrase
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-green-400 bg-green-400/10'
                  }`}
                  style={{
                    background:
                      flickeringPhrase === phrase
                        ? 'linear-gradient(45deg, #8b5cf6, #a855f7, #dc2626)'
                        : undefined,
                    backgroundSize: flickeringPhrase === phrase ? '200% 200%' : undefined,
                    animation:
                      flickeringPhrase === phrase ? 'gradientShift 0.5s ease-in-out' : undefined,
                  }}
                >
                  {flickeringPhrase === phrase ? flickerText : phrase}
                </div>
              ))}
            </div>
          )}

          {gameState.foundPhrases.length > 0 && (
            <div className="text-center text-green-400 text-sm">
              {gameState.foundPhrases.length} / {gameState.broadcast.phrases.length} signals decoded
            </div>
          )}
        </div>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    </>
  );
};
