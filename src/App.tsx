import { useMemo, useRef, useState } from 'react';
import Equalizer from './Equalizer';

type Mode = 'element' | 'mic';

export default function App() {
  const [mode, setMode] = useState<Mode>('element');
  const audioRef = useRef<HTMLAudioElement>(null);

  // useMemo(() => {
  //   if (mode === 'element' && audioRef.current) {
  //     audioRef.current.play().catch(() => {});
  //   }
  // }, [mode]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Framer Motion Equalizer</h1>
          <div className="inline-flex rounded-xl overflow-hidden border border-zinc-700">
            <button
              className={`px-3 py-2 text-sm ${mode === 'element' ? 'bg-zinc-800' : 'bg-zinc-900'}`}
              onClick={() => setMode('element')}
            >
              Audio file
            </button>
            <button
              className={`px-3 py-2 text-sm ${mode === 'mic' ? 'bg-zinc-800' : 'bg-zinc-900'}`}
              onClick={() => setMode('mic')}
            >
              Mic
            </button>
          </div>
        </header>

        {mode === 'element' && (
          <audio ref={audioRef} className="w-full" src="/track.wav" controls preload="metadata" />
        )}

        <Equalizer mode={mode} audioEl={mode === 'element' ? audioRef.current : null} bars={36} />
        <p className="text-xs text-zinc-400">
          {mode === 'mic'
            ? 'In Mic mode, the browser will ask for access to the microphone.'
            : 'Put the track.wav file in /public or use your own track.'}
        </p>
      </div>
    </div>
  );
}
