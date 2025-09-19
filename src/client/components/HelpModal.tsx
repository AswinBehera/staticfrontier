import { PropsWithChildren } from 'react';

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export const HelpModal = ({ open, onClose }: HelpModalProps & PropsWithChildren) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-black border border-green-400/40 rounded-sm p-4 max-w-md w-[92%] text-green-300 font-mono">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold tracking-widest text-green-300">HOW TO PLAY</div>
          <button className="text-green-400/80 hover:text-green-200 text-sm" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="text-xs space-y-2">
          <div>1) Tune Frequency and Modulation to find signals.</div>
          <div>2) Decode all phrases (watch the display for new signals).</div>
          <div>3) Submit the meta answer to claim the territory.</div>
        </div>
        <div className="mt-3 text-[10px] text-green-500">
          Tip: Signals stabilize as you get closer.
        </div>
      </div>
    </div>
  );
};
