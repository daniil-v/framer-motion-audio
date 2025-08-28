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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col sm:items-center sm:justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl space-y-4 sm:space-y-6 flex flex-col items-center flex-1 sm:flex-none">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
            Audio Visualizer
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Audio source selector */}
            {availableModes.length > 1 && (
              <div className="inline-flex rounded-xl overflow-hidden border border-zinc-700 w-full sm:w-auto">
                {isModeEnabled('element') && (
                  <button
                    className={`flex-1 sm:flex-none px-4 py-3 sm:px-3 sm:py-2 text-sm ${mode === 'element' ? 'bg-zinc-800' : 'bg-zinc-900'} min-h-[44px] sm:min-h-0`}
                    onClick={() => setMode('element')}
                  >
                    Audio file
                  </button>
                )}
                {isModeEnabled('mic') && (
                  <button
                    className={`flex-1 sm:flex-none px-4 py-3 sm:px-3 sm:py-2 text-sm ${mode === 'mic' ? 'bg-zinc-800' : 'bg-zinc-900'} min-h-[44px] sm:min-h-0`}
                    onClick={() => setMode('mic')}
                  >
                    Mic
                  </button>
                )}
              </div>
            )}

            {/* Visualization mode selector */}
            {availableVizModes.length > 1 && (
              <div className="inline-flex rounded-xl overflow-hidden border border-zinc-700 w-full sm:w-auto">
                {isVizModeEnabled('ripples') && (
                  <button
                    className={`flex-1 sm:flex-none px-4 py-3 sm:px-3 sm:py-2 text-sm ${vizMode === 'ripples' ? 'bg-zinc-800' : 'bg-zinc-900'} min-h-[44px] sm:min-h-0`}
                    onClick={() => setVizMode('ripples')}
                  >
                    Ripples
                  </button>
                )}
                {isVizModeEnabled('equalizer') && (
                  <button
                    className={`flex-1 sm:flex-none px-4 py-3 sm:px-3 sm:py-2 text-sm ${vizMode === 'equalizer' ? 'bg-zinc-800' : 'bg-zinc-900'} min-h-[44px] sm:min-h-0`}
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
          <audio
            ref={audioRef}
            className="w-full max-w-md"
            src="/track.wav"
            controls
            preload="metadata"
          />
        )}

        {mode === 'mic' && isModeEnabled('mic') && !micStarted && (
          <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-2xl p-4 w-full max-w-2xl flex-1 sm:flex-none sm:aspect-video">
            <div className="text-center">
              <button
                onClick={() => setMicStarted(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-colors min-h-[44px]"
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
                <div className="w-full max-w-2xl flex-1 sm:flex-none">
                  <VoiceRipples
                    mode={mode}
                    audioEl={mode === 'element' ? audioRef.current : null}
                    color="rgba(99,102,241,0.9)"
                    bgClass="bg-black"
                    sensitivity={0.02}
                    rippleDuration={3.5}
                    micStarted={mode === 'mic' ? micStarted : undefined}
                    className="sm:aspect-video"
                  />
                </div>
              )}

              {vizMode === 'equalizer' && isVizModeEnabled('equalizer') && (
                <div className="w-full max-w-2xl flex-1 sm:flex-none">
                  <Equalizer
                    mode={mode}
                    audioEl={mode === 'element' ? audioRef.current : null}
                    bars={36}
                    micStarted={mode === 'mic' ? micStarted : undefined}
                    className="sm:aspect-video"
                  />
                </div>
              )}
            </>
          )}

        {availableModes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">No equalizer modes are currently enabled.</p>
            <p className="text-xs text-zinc-500 mt-2">Check the feature flags in config.ts</p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-zinc-400 text-center px-4">
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
