import { useEffect, useRef, useState } from 'react';
import Equalizer from './Equalizer';
import { getAvailableModes, getDefaultMode, isModeEnabled } from './config';

type Mode = 'element' | 'mic';

export default function App() {
  const availableModes = getAvailableModes();
  const defaultMode = getDefaultMode();
  const [mode, setMode] = useState<Mode>(defaultMode || 'element');
  const [micStarted, setMicStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset mic started state when switching away from mic mode
  useEffect(() => {
    if (mode !== 'mic') {
      setMicStarted(false);
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Framer Motion Equalizer</h1>
          {availableModes.length > 1 && (
            <div className="inline-flex rounded-xl overflow-hidden border border-zinc-700">
              {isModeEnabled('element') && (
                <button
                  className={`px-3 py-2 text-sm ${mode === 'element' ? 'bg-zinc-800' : 'bg-zinc-900'}`}
                  onClick={() => setMode('element')}
                >
                  Audio file
                </button>
              )}
              {isModeEnabled('mic') && (
                <button
                  className={`px-3 py-2 text-sm ${mode === 'mic' ? 'bg-zinc-800' : 'bg-zinc-900'}`}
                  onClick={() => setMode('mic')}
                >
                  Mic
                </button>
              )}
            </div>
          )}
        </header>

        {mode === 'element' && isModeEnabled('element') && (
          <audio ref={audioRef} className="w-full" src="/track.wav" controls preload="metadata" />
        )}

        {mode === 'mic' && isModeEnabled('mic') && !micStarted && (
          <div className="text-center py-8">
            <button
              onClick={() => setMicStarted(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-colors"
            >
              Start Microphone
            </button>
            <p className="text-xs text-zinc-500 mt-2">
              Click to enable microphone access and start the equalizer
            </p>
          </div>
        )}

        {availableModes.length > 0 && (mode !== 'mic' || micStarted) && (
          <Equalizer
            mode={mode}
            audioEl={mode === 'element' ? audioRef.current : null}
            bars={36}
            micStarted={mode === 'mic' ? micStarted : undefined}
          />
        )}

        {availableModes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">No equalizer modes are currently enabled.</p>
            <p className="text-xs text-zinc-500 mt-2">Check the feature flags in config.ts</p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            {mode === 'mic' && isModeEnabled('mic') && micStarted
              ? 'Microphone is active. Speak or play music near your device.'
              : mode === 'element' && isModeEnabled('element')
                ? 'Put the track.wav file in /public or use your own track.'
                : availableModes.length > 1
                  ? 'Select a mode to start the equalizer.'
                  : mode === 'mic' && isModeEnabled('mic') && !micStarted
                    ? 'Click "Start Microphone" to begin.'
                    : 'Ready to start the equalizer.'}
          </p>
        )}
      </div>
    </div>
  );
}
