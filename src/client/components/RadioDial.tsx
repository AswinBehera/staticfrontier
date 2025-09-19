import { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../hooks/gameContext';
import { useSfx } from '../hooks/useSfx';
import { TuningSlot } from './TuningSlot';

export const RadioDial = () => {
  const { checkPhrase, gameState } = useGame();
  const { beginInteraction, endInteraction, setSweepLevel, resetFade } = useSfx();
  const [frequency, setFrequency] = useState(50);
  const [modulation, setModulation] = useState(25);
  const [isInteracting, setIsInteracting] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const holdDamp = useRef(1);

  const strength = useMemo(() => {
    const phrases = gameState.broadcast.phrases;
    let bestDist = Number.POSITIVE_INFINITY;
    phrases.forEach((p) => {
      const df = Math.abs(frequency - p.frequency);
      const dm = Math.abs(modulation - p.modulation);
      const dist = Math.sqrt(df * df + dm * dm);
      if (dist < bestDist) bestDist = dist;
    });
    const maxDistance = 20;
    return Math.max(
      0,
      Math.min(
        1,
        1 - (bestDist === Number.POSITIVE_INFINITY ? maxDistance : bestDist) / maxDistance
      )
    );
  }, [frequency, modulation, gameState.broadcast.phrases]);

  useEffect(() => {
    const level = strength * holdDamp.current;
    setSweepLevel(level);
  }, [strength, isInteracting, setSweepLevel]);

  const startHoldTimer = () => {
    stopHoldTimer();
    holdDamp.current = 1;
    holdTimer.current = window.setTimeout(() => {
      // after 3s, damp to 30%
      holdDamp.current = 0.3;
      const level = strength * holdDamp.current;
      setSweepLevel(level);
    }, 3000) as unknown as number;
  };
  const stopHoldTimer = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    holdDamp.current = 1;
  };

  const onStartInteract = () => {
    setIsInteracting(true);
    beginInteraction();
    startHoldTimer();
  };
  const onEndInteract = () => {
    setIsInteracting(false);
    endInteraction();
    stopHoldTimer();
  };

  const handleFrequencyChange = (value: number) => {
    setFrequency(value);
    void checkTuning(value, modulation);
    resetFade(); // Reset fade when user moves
    startHoldTimer();
  };

  const handleModulationChange = (value: number) => {
    setModulation(value);
    void checkTuning(frequency, value);
    resetFade(); // Reset fade when user moves
    startHoldTimer();
  };

  const checkTuning = async (freq: number, mod: number) => {
    try {
      await checkPhrase(freq, mod);
    } catch (error) {
      console.error('Tuning error:', error);
    }
  };

  return (
    <div className="bg-black border border-green-300/40 p-5 rounded-sm">
      <h2 className="text-sm tracking-widest font-bold mb-3 text-green-300">RADIO TUNING</h2>

      <div className="space-y-5">
        {/* Frequency Dial */}
        <div>
          <label className="block text-xs font-mono mb-2 text-green-300/90">
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
              onMouseDown={onStartInteract}
              onMouseUp={onEndInteract}
              onTouchStart={onStartInteract}
              onTouchEnd={onEndInteract}
              className="w-full h-2 bg-gray-800 rounded appearance-none slider"
            />
            <div className="flex justify-between text-[10px] text-green-700 mt-1">
              <span>0</span>
              <span>54</span>
              <span>108</span>
            </div>
          </div>
        </div>

        {/* Modulation Dial */}
        <div>
          <label className="block text-xs font-mono mb-2 text-green-300/90">
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
              onMouseDown={onStartInteract}
              onMouseUp={onEndInteract}
              onTouchStart={onStartInteract}
              onTouchEnd={onEndInteract}
              className="w-full h-2 bg-gray-800 rounded appearance-none slider"
            />
            <div className="flex justify-between text-[10px] text-green-700 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Tuning Slot Preview (always visible, animate only during interaction) */}
        <TuningSlot
          frequency={frequency}
          modulation={modulation}
          phrases={gameState.broadcast.phrases}
          foundPhrases={gameState.foundPhrases}
          animate={isInteracting}
        />

        {/* Signal Strength Indicator */}
        <div className="mt-4">
          <div className="text-[10px] text-green-500/80 mb-2">SIGNAL STRENGTH</div>
          <div className="flex space-x-0.5 h-2">
            {(() => {
              const bars = Math.floor(strength * 10);
              return Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-sm transition-all duration-300 ${
                    i < bars ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-green-700/30'
                  }`}
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animation: i < bars ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                />
              ));
            })()}
          </div>
        </div>
      </div>

      <style>{`
        .slider {
          transition: all 0.2s ease;
        }
        
        .slider:hover {
          transform: scale(1.02);
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d399, #10b981);
          cursor: pointer;
          border: 2px solid #064e3b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(52, 211, 153, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 12px rgba(52, 211, 153, 0.5);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(52, 211, 153, 0.6);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d399, #10b981);
          cursor: pointer;
          border: 2px solid #064e3b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(52, 211, 153, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 12px rgba(52, 211, 153, 0.5);
        }
        
        .slider::-moz-range-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(52, 211, 153, 0.6);
        }
        
        .slider::-webkit-slider-track {
          background: linear-gradient(to right, #1f2937, #374151);
          border-radius: 4px;
          height: 6px;
        }
        
        .slider::-moz-range-track {
          background: linear-gradient(to right, #1f2937, #374151);
          border-radius: 4px;
          height: 6px;
          border: none;
        }
      `}</style>
    </div>
  );
};
