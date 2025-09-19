import { useEffect, useState } from 'react';

export const AsciiIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fast intro - just show the title for a brief moment
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 800); // Show for 0.8 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-400 mb-4 animate-pulse">STATIC FRONTIER</h1>
        <div className="text-green-300 text-lg">Loading...</div>
      </div>
    </div>
  );
};
