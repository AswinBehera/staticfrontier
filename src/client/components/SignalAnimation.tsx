import { useEffect, useState } from 'react';

type SignalAnimationProps = {
  isVisible: boolean;
  onComplete?: () => void;
};

export const SignalAnimation = ({ isVisible, onComplete }: SignalAnimationProps) => {
  const [animationPhase, setAnimationPhase] = useState<'signal' | 'decode' | 'complete'>('signal');

  useEffect(() => {
    if (!isVisible) return;

    // Signal detection phase
    setAnimationPhase('signal');
    const signalTimer = setTimeout(() => {
      setAnimationPhase('decode');
    }, 800);

    // Decode phase
    const decodeTimer = setTimeout(() => {
      setAnimationPhase('complete');
    }, 1200);

    // Complete animation
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);

    return () => {
      clearTimeout(signalTimer);
      clearTimeout(decodeTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Signal Detection Animation */}
        {animationPhase === 'signal' && (
          <div className="space-y-4">
            <div className="text-green-400 text-2xl font-mono animate-pulse">████ ████ ████</div>
            <div className="text-green-300 text-sm">SIGNAL DETECTED...</div>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        )}

        {/* Decode Animation */}
        {animationPhase === 'decode' && (
          <div className="space-y-4">
            <div className="text-yellow-400 text-2xl font-mono">████ ████ ████</div>
            <div className="text-yellow-300 text-sm">DECODING SIGNAL...</div>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {/* Complete Animation */}
        {animationPhase === 'complete' && (
          <div className="space-y-4">
            <div className="text-green-400 text-3xl font-mono animate-pulse">
              ✓ SIGNAL DECODED ✓
            </div>
            <div className="text-green-300 text-sm">TRANSMISSION RECEIVED</div>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              <div
                className="w-3 h-3 bg-green-400 rounded-full animate-ping"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-3 h-3 bg-green-400 rounded-full animate-ping"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
