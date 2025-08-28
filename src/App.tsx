import { useEffect, useRef, useState } from 'react';
import Equalizer from './Equalizer';
import VoiceRipples from './Ripples';
import {
  getAvailableModes,
  getDefaultMode,
  isModeEnabled,
  getAvailableVizModes,
  getDefaultVizMode,
  isVizModeEnabled,
} from './config';

type Mode = 'element' | 'mic';
type VizMode = 'equalizer' | 'ripples';

export default function App() {
  const availableModes = getAvailableModes();
  const availableVizModes = getAvailableVizModes();
  const defaultMode = getDefaultMode();
  const defaultVizMode = getDefaultVizMode();
  const [mode, setMode] = useState<Mode>(defaultMode || 'element');
  const [vizMode, setVizMode] = useState<VizMode>(defaultVizMode || 'equalizer');
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
      <div className="w-full max-w-3xl space-y-6 flex flex-col items-center">
        <header className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-semibold">Audio Visualizer</h1>
          <div className="flex gap-4">
            {/* Audio source selector */}
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

            {/* Visualization mode selector */}
            {availableVizModes.length > 1 && (
              <div className="inline-flex rounded-xl overflow-hidden border border-zinc-700">
                {isVizModeEnabled('ripples') && (
                  <button
                    className={`px-3 py-2 text-sm ${vizMode === 'ripples' ? 'bg-zinc-800' : 'bg-zinc-900'}`}
                    onClick={() => setVizMode('ripples')}
                  >
                    Ripples
                  </button>
                )}
                {isVizModeEnabled('equalizer') && (
                  <button
                    className={`px-3 py-2 text-sm ${vizMode === 'equalizer' ? 'bg-zinc-800' : 'bg-zinc-900'}`}
                    onClick={() => setVizMode('equalizer')}
                  >
                    Equalizer
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {mode === 'element' && isModeEnabled('element') && (
          <audio ref={audioRef} className="w-full" src="/track.wav" controls preload="metadata" />
        )}

        {mode === 'mic' && isModeEnabled('mic') && !micStarted && (
          <div
            className="flex flex-col items-center justify-center bg-zinc-900 rounded-2xl p-4"
            style={{ width: 640, height: 360 }}
          >
            <div className="text-center">
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
          </div>
        )}

        {availableModes.length > 0 &&
          availableVizModes.length > 0 &&
          (mode !== 'mic' || micStarted) && (
            <>
              {vizMode === 'ripples' && isVizModeEnabled('ripples') && (
                <VoiceRipples
                  mode={mode}
                  audioEl={mode === 'element' ? audioRef.current : null}
                  theme="violet"
                  width={640}
                  height={360}
                  sensitivity={0.05}
                  rippleDuration={2.1}
                  micStarted={mode === 'mic' ? micStarted : undefined}
                />
              )}

              {vizMode === 'equalizer' && isVizModeEnabled('equalizer') && (
                <Equalizer
                  mode={mode}
                  audioEl={mode === 'element' ? audioRef.current : null}
                  bars={36}
                  width={640}
                  height={360}
                  micStarted={mode === 'mic' ? micStarted : undefined}
                />
              )}
            </>
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
