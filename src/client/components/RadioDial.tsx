import { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';

export const RadioDial = () => {
  const { checkPhrase, gameState } = useGameState();
  const [frequency, setFrequency] = useState(50);
  const [modulation, setModulation] = useState(25);
  const [isTuning, setIsTuning] = useState(false);

  const handleFrequencyChange = (value: number) => {
    setFrequency(value);
    checkTuning(value, modulation);
  };

  const handleModulationChange = (value: number) => {
    setModulation(value);
    checkTuning(frequency, value);
  };

  const checkTuning = async (freq: number, mod: number) => {
    setIsTuning(true);
    try {
      await checkPhrase(freq, mod);
    } catch (error) {
      console.error('Tuning error:', error);
    } finally {
      setIsTuning(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-green-400 p-6 rounded">
      <h2 className="text-lg font-bold mb-4 text-green-400">RADIO TUNING</h2>
      
      <div className="space-y-6">
        {/* Frequency Dial */}
        <div>
          <label className="block text-sm font-mono mb-2">
            FREQUENCY: {frequency.toFixed(1)} MHz
          </label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="108"
              step="0.1"
              value={frequency}
              onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #a855f7 50%, #dc2626 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>54</span>
              <span>108</span>
            </div>
          </div>
        </div>

        {/* Modulation Dial */}
        <div>
          <label className="block text-sm font-mono mb-2">
            MODULATION: {modulation.toFixed(1)}%
          </label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="50"
              step="0.1"
              value={modulation}
              onChange={(e) => handleModulationChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #a855f7 50%, #dc2626 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="text-center">
          {isTuning ? (
            <div className="text-yellow-400 animate-pulse">
              TUNING... ████▒▒▒▒
            </div>
          ) : (
            <div className="text-gray-500">
              Adjust dials to find the signal
            </div>
          )}
        </div>

        {/* Signal Strength Indicator */}
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">SIGNAL STRENGTH</div>
          <div className="flex space-x-1">
            {(() => {
              // Calculate signal strength based on proximity to actual frequencies
              const maxDistance = 20; // Maximum distance for any signal
              let maxSignal = 0;
              
              // Check proximity to each puzzle frequency
              gameState.broadcast.phrases.forEach(phrase => {
                const freqDistance = Math.abs(frequency - phrase.frequency);
                const modDistance = Math.abs(modulation - phrase.modulation);
                const totalDistance = Math.sqrt(freqDistance * freqDistance + modDistance * modDistance);
                const signalStrength = Math.max(0, 1 - (totalDistance / maxDistance));
                maxSignal = Math.max(maxSignal, signalStrength);
              });
              
              const barsToShow = Math.floor(maxSignal * 10);
              
              return Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i < barsToShow
                      ? 'bg-green-400'
                      : 'bg-gray-700'
                  }`}
                />
              ));
            })()}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #000;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #000;
        }
      `}</style>
    </div>
  );
};
