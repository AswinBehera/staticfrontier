import { useEffect, useMemo, useRef, useState } from 'react';
import type { Phrase } from '../../shared/types/api';

type TuningSlotProps = {
  frequency: number;
  modulation: number;
  phrases: Phrase[];
  foundPhrases: string[];
  animate?: boolean;
};

export const TuningSlot = ({
  frequency,
  modulation,
  phrases,
  foundPhrases,
  animate = true,
}: TuningSlotProps) => {
  const [animatedText, setAnimatedText] = useState<string>('');
  const rafRef = useRef<number | null>(null);

  const { targetPhrase, strength, allFound } = useMemo(() => {
    const found = new Set(foundPhrases);
    const candidates = phrases.filter((p) => !found.has(p.text));
    const pool = candidates.length > 0 ? candidates : phrases;

    let best = pool[0] as Phrase | undefined;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const p of pool) {
      const df = Math.abs(frequency - p.frequency);
      const dm = Math.abs(modulation - p.modulation);
      const dist = Math.sqrt(df * df + dm * dm);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }

    const maxDistance = 20;
    const clampedStrength = Math.max(
      0,
      Math.min(
        1,
        1 - (bestDist === Number.POSITIVE_INFINITY ? maxDistance : bestDist) / maxDistance
      )
    );

    return {
      targetPhrase: best ? best.text : null,
      strength: clampedStrength,
      allFound: foundPhrases.length === phrases.length,
    };
  }, [frequency, modulation, phrases, foundPhrases]);

  const noiseChars = '█▓▒░#@%&*+=-_/\\|<>~^:;.,';

  useEffect(() => {
    if (!targetPhrase) {
      setAnimatedText('');
      return;
    }

    const makeFrame = () => {
      let lockProgress = strength;
      if (lockProgress > 0.8) {
        lockProgress = 0.8 + (lockProgress - 0.8) * 0.5;
      }
      const total = targetPhrase.length;
      const lockedCount = Math.floor(total * lockProgress);
      const result = targetPhrase
        .split('')
        .map((ch, idx) => {
          if (idx < lockedCount) return ch;
          if (ch === ' ') return ' ';
          return noiseChars[Math.floor(Math.random() * noiseChars.length)];
        })
        .join('');
      return result;
    };

    if (animate) {
      const loop = () => {
        setAnimatedText(makeFrame());
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      setAnimatedText((prev) => (prev ? prev : makeFrame()));
    }
  }, [targetPhrase, strength, animate]);

  return (
    <div className="rounded-sm p-3 border border-green-300/30 bg-black/60">
      <div className="text-xs text-green-300/70 mb-1">SIGNAL PREVIEW</div>
      <div
        className="font-mono text-sm whitespace-pre-wrap break-words bg-clip-text text-transparent min-h-16"
        style={{
          backgroundImage: 'linear-gradient(45deg, #8b5cf6, #a855f7, #dc2626)',
          backgroundSize: '200% 200%',
          animation: 'slotGradient 2.5s ease-in-out infinite',
        }}
      >
        {allFound ? 'All signals decoded.' : targetPhrase ? animatedText : '—'}
      </div>
      <style>{`
        @keyframes slotGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};
