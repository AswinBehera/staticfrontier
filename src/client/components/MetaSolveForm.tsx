import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';

export const MetaSolveForm = () => {
  const { gameState, solveMeta } = useGameState();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const allPhrasesFound = gameState.foundPhrases.length === gameState.broadcast.phrases.length;
  const canSubmit = allPhrasesFound && !gameState.isMetaSolved && answer.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await solveMeta(answer.trim());
      if (result.success) {
        if (result.isWinner) {
          setMessage('🎉 CONGRATULATIONS! You claimed the territory!');
        } else {
          setMessage(`✅ Correct! You earned ${result.echoPoints} Echo Points.`);
        }
        setAnswer('');
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage('❌ Error submitting answer. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (gameState.isMetaSolved) {
    return (
      <div className="bg-gray-900 border border-green-400 p-6 rounded">
        <h2 className="text-lg font-bold mb-4 text-green-400">META PUZZLE SOLVED</h2>
        <div className="text-center text-green-400">
          <div className="text-xl mb-2">🎉 TERRITORY CLAIMED</div>
          <div className="text-sm">The meta puzzle has been solved!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-green-400 p-6 rounded">
      <h2 className="text-lg font-bold mb-4 text-green-400">META PUZZLE</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-300">
          {allPhrasesFound ? (
            <div className="text-green-400">
              ✓ All signals decoded. What do they reveal?
            </div>
          ) : (
            <div className="text-yellow-400">
              Decode all {gameState.broadcast.phrases.length} signals first
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-mono mb-2">
              META ANSWER:
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer..."
              className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300"
              disabled={!allPhrasesFound || isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-2 px-4 font-mono text-sm ${
              canSubmit && !isSubmitting
                ? 'bg-green-400 text-black hover:bg-green-300'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT ANSWER'}
          </button>
        </form>

        {message && (
          <div className={`text-center text-sm p-3 rounded ${
            message.includes('🎉') || message.includes('✅')
              ? 'bg-green-400/20 text-green-400'
              : 'bg-red-400/20 text-red-400'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
