import { useEffect, useRef, useState } from 'react';

export const useSfx = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sweepOscRef = useRef<OscillatorNode | null>(null);
  const sweepGainRef = useRef<GainNode | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const isFadedRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);

  const ensureContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current!;
  };

  const startSweep = () => {
    const ctx = ensureContext();
    if (sweepOscRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    sweepOscRef.current = osc;
    sweepGainRef.current = gain;
  };

  const stopSweep = () => {
    if (sweepOscRef.current) {
      try {
        sweepOscRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      sweepOscRef.current.disconnect();
      sweepOscRef.current = null;
    }
    if (sweepGainRef.current) {
      sweepGainRef.current.disconnect();
      sweepGainRef.current = null;
    }
  };

  const setSweepLevel = (strength: number) => {
    if (!sweepOscRef.current || !sweepGainRef.current) return;
    const ctx = ensureContext();
    const clamped = Math.max(0, Math.min(1, strength));
    const freq = 220 + clamped * 880;
    const baseVol = 0.015 + clamped * 0.03;
    const fadeMultiplier = isFadedRef.current ? 0.1 : 1.0; // 10% volume when faded
    const muteMultiplier = isMutedRef.current ? 0 : 1; // 0% volume when muted
    const vol = baseVol * fadeMultiplier * muteMultiplier;
    sweepOscRef.current.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 0.05);
    sweepGainRef.current.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
  };

  const beginInteraction = () => {
    const ctx = ensureContext();
    if (ctx.state === 'suspended') void ctx.resume();
    startSweep();

    // Reset fade state
    isFadedRef.current = false;

    // Clear any existing fade timeout
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  const endInteraction = () => {
    const ctx = ensureContext();

    // Start gradual fade out immediately when user stops interacting
    if (sweepGainRef.current) {
      const currentGain = sweepGainRef.current.gain.value;
      sweepGainRef.current.gain.linearRampToValueAtTime(currentGain * 0.1, ctx.currentTime + 1.0); // Fade over 1 second
    }

    // Clear fade timeout
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = window.setTimeout(() => {
      stopSweep();
    }, 2000) as unknown as number; // Give more time for the fade
  };

  useEffect(
    () => () => {
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
      stopSweep();
    },
    []
  );

  const resetFade = () => {
    // Reset fade state when user starts moving again
    isFadedRef.current = false;
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  };

  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const newMutedState = !isMutedRef.current;
    isMutedRef.current = newMutedState;
    setIsMuted(newMutedState);

    // Immediately stop any playing sound if muting
    if (newMutedState) {
      stopSweep();
    }

    return newMutedState;
  };

  return {
    beginInteraction,
    endInteraction,
    setSweepLevel,
    resetFade,
    toggleMute,
    isMuted,
  };
};
