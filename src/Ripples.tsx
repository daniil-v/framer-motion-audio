import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * VoiceRipples — water ripples that react to voice/audio
 * --------------------------------------------------------
 * - Uses Web Audio API (AnalyserNode) to read signal level (RMS)
 * - When sensitivity threshold is exceeded, spawns expanding and fading rings
 * - Framer Motion animates radius and opacity
 *
 * Modes:
 *  - mode="mic" — microphone input
 *  - mode="element" — <audio> element via audioEl prop
 *
 * Usage example:
 *  const ref = useRef<HTMLAudioElement>(null)
 *  <audio ref={ref} src="/track.wav" controls />
 *  <VoiceRipples mode="element" audioEl={ref.current} />
 */

export type VoiceRipplesProps = {
  mode?: 'mic' | 'element';
  audioEl?: HTMLAudioElement | null;
  width?: number; // px
  height?: number; // px
  sensitivity?: number; // 0..1 — threshold for spawning ripples
  fftSize?: 256 | 512 | 1024 | 2048;
  smoothing?: number; // 0..1
  cooldownMs?: number; // minimum time between ripples
  rippleDuration?: number; // seconds
  maxRipples?: number; // limit of simultaneously visible ripples
  ringWidth?: number; // strokeWidth (override preset)
  color?: string; // stroke color (override preset)
  bgClass?: string; // Tailwind class for background (override preset)
  theme?: ThemeName; // preset name
  micStarted?: boolean; // For mic mode, indicates if user has clicked start
};

// --- Theme presets ---
type ThemeName = 'cyan' | 'azure' | 'violet' | 'emerald' | 'amber' | 'rose' | 'mono';
const THEMES: Record<ThemeName, { color: string; bgClass: string; ringWidth: number }> = {
  cyan: {
    color: 'rgba(56,189,248,0.9)',
    bgClass: 'bg-gradient-to-b from-slate-900 to-black',
    ringWidth: 2,
  },
  azure: {
    color: 'rgba(59,130,246,0.9)',
    bgClass: 'bg-gradient-to-b from-slate-900 to-indigo-950',
    ringWidth: 2,
  },
  violet: {
    color: 'rgba(168,85,247,0.9)',
    bgClass: 'bg-gradient-to-b from-slate-900 to-violet-950',
    ringWidth: 2,
  },
  emerald: {
    color: 'rgba(16,185,129,0.9)',
    bgClass: 'bg-gradient-to-b from-slate-900 to-emerald-950',
    ringWidth: 2,
  },
  amber: {
    color: 'rgba(245,158,11,0.9)',
    bgClass: 'bg-gradient-to-b from-slate-900 to-amber-950',
    ringWidth: 2,
  },
  rose: {
    color: 'rgba(244,63,94,0.9)',
    bgClass: 'bg-gradient-to-b from-slate-900 to-rose-950',
    ringWidth: 2,
  },
  mono: {
    color: 'rgba(226,232,240,0.85)',
    bgClass: 'bg-gradient-to-b from-zinc-900 to-black',
    ringWidth: 1.5,
  },
};

export default function VoiceRipples({
  mode = 'mic',
  audioEl = null,
  width = 480,
  height = 320,
  sensitivity = 0.18,
  fftSize = 1024,
  smoothing = 0.8,
  cooldownMs = 120,
  rippleDuration = 1.9,
  maxRipples = 12,
  theme = 'cyan' as ThemeName,
  ringWidth,
  color, // cyan-400
  bgClass,
  micStarted = false,
}: VoiceRipplesProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const prevLevelRef = useRef<number>(0);

  // Calculate dimensions first (account for padding)
  const innerWidth = width - 32; // Account for p-4 padding (16px * 2)
  const innerHeight = height - 64; // Account for padding + bottom info text
  const center = useMemo(
    () => ({ x: innerWidth / 2, y: innerHeight / 2 }),
    [innerWidth, innerHeight],
  );
  const maxR = Math.min(innerWidth, innerHeight) * 0.5 * 0.95; // slightly inside the edge

  // Audio level 0..1 in MotionValue, smooth with spring for UI
  const levelMv = useMotionValue(0);
  const level = useSpring(levelMv, { stiffness: 200, damping: 30, mass: 0.5 });

  // Transform motion values for animations
  const centralRadius = useTransform(level, (v: number) => 12 + v * maxR * 0.25);
  const centralOpacity = useTransform(level, (v: number) => 0.25 + v * 0.35);

  // Ripples (keys) for AnimatePresence
  const [ripples, setRipples] = useState<Array<{ id: number }>>([]);
  const [ready, setReady] = useState(false);

  // Theme resolve (presets with optional overrides)
  const preset = THEMES[theme] ?? THEMES.cyan;
  const strokeW = ringWidth ?? preset.ringWidth;
  const strokeColor = color ?? preset.color;
  const surfaceBgClass = bgClass ?? preset.bgClass;

  useEffect(() => {
    // For mic mode, wait until user has clicked start
    if (mode === 'mic' && !micStarted) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let cleanupAudio: (() => void) | undefined;

    async function setupAudioContext() {
      if (cancelled) return;

      try {
        const AC =
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx: AudioContext = ctxRef.current ?? new AC();
        ctxRef.current = ctx;

        // Resume context if suspended (required for user interaction)
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothing;
        analyserRef.current = analyser;

        let src: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;

        if (mode === 'element') {
          if (!audioEl) return; // wait until we get the element reference

          // Check if we already have a source for this element
          if (srcRef.current) {
            srcRef.current.disconnect();
          }

          // Connect audio element to analyzer graph
          src = ctx.createMediaElementSource(audioEl);
          src.connect(analyser);
          analyser.connect(ctx.destination); // to hear audio
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          src = ctx.createMediaStreamSource(stream);
          src.connect(analyser);
        }

        srcRef.current = src;

        const timeBuf = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          if (cancelled) return;

          // Only analyze if audio context is running and (for element mode) audio is playing
          if (ctx.state !== 'running' || (mode === 'element' && audioEl && audioEl.paused)) {
            levelMv.set(0);
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          analyser.getByteTimeDomainData(timeBuf); // 0..255 around 128
          // RMS calculation
          let sum = 0;
          for (let i = 0; i < timeBuf.length; i++) {
            const v = (timeBuf[i] - 128) / 128; // -1..1
            sum += v * v;
          }
          const rms = Math.sqrt(sum / timeBuf.length); // 0..~1

          // Sanitize and light compressor for sharp peaks
          const compressed = Math.min(1, rms * 1.8);
          levelMv.set(compressed);

          // Spawn ripple on up-trigger + cooldown
          const prev = prevLevelRef.current;
          const now = performance.now();
          if (
            compressed >= sensitivity &&
            prev < sensitivity &&
            now - lastSpawnRef.current > cooldownMs
          ) {
            lastSpawnRef.current = now;
            setRipples((arr) => {
              const id = now + Math.random();
              const next = [...arr, { id }];
              return next.length > maxRipples ? next.slice(next.length - maxRipples) : next;
            });
          }
          prevLevelRef.current = compressed;

          rafRef.current = requestAnimationFrame(loop);
        };

        setReady(true);
        rafRef.current = requestAnimationFrame(loop);

        // Add event listeners for audio element
        if (mode === 'element' && audioEl) {
          const handlePlay = async () => {
            if (ctx.state === 'suspended') {
              await ctx.resume();
            }
          };

          const handlePause = () => {
            levelMv.set(0);
          };

          audioEl.addEventListener('play', handlePlay);
          audioEl.addEventListener('pause', handlePause);
          audioEl.addEventListener('ended', handlePause);

          cleanupAudio = () => {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('pause', handlePause);
            audioEl.removeEventListener('ended', handlePause);
          };
        }
      } catch (error) {
        console.error('Error setting up ripples audio:', error);
      }
    }

    // For element mode, wait for user interaction (play event)
    if (mode === 'element' && audioEl) {
      const handlePlay = async () => {
        await setupAudioContext();
      };

      audioEl.addEventListener('play', handlePlay);
      cleanupAudio = () => {
        audioEl.removeEventListener('play', handlePlay);
      };
    } else if (mode === 'mic' && micStarted) {
      // For mic mode, setup only after user has clicked start
      setupAudioContext();
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      analyserRef.current?.disconnect();
      srcRef.current?.disconnect();
      cleanupAudio?.();
    };
  }, [mode, audioEl, fftSize, smoothing, sensitivity, cooldownMs, maxRipples, micStarted, levelMv]);

  return (
    <div className={`rounded-2xl ${surfaceBgClass} p-4`} style={{ width, height }}>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ width: innerWidth, height: innerHeight }}
      >
        {/* SVG water surface */}
        <svg
          width={innerWidth}
          height={innerHeight}
          className="absolute inset-0"
          role="img"
          aria-label="Voice ripples visualization"
        >
          <defs>
            <radialGradient id="ripplesGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.9} />
              <stop offset="60%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </radialGradient>
            <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.25" />
            </filter>
          </defs>

          {/* Pulsing central wave based on audio level */}
          <motion.circle
            cx={center.x}
            cy={center.y}
            r={centralRadius}
            stroke="none"
            fill="url(#ripplesGradient)"
            style={{
              filter: 'url(#softBlur)',
              opacity: centralOpacity,
            }}
          />

          {/* Expanding ripple rings */}
          <AnimatePresence>
            {ripples.map(({ id }) => (
              <motion.circle
                key={id}
                cx={center.x}
                cy={center.y}
                r={0}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeW}
                initial={{ r: 0, opacity: 0.9 }}
                animate={{ r: maxR, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: rippleDuration, ease: 'easeOut' }}
                style={{ filter: 'url(#softBlur)' }}
                onAnimationComplete={() => {
                  // Remove ripple when animation completes
                  setRipples((arr) => arr.filter((x) => x.id !== id));
                }}
              />
            ))}
          </AnimatePresence>
        </svg>

        {/* Light surface reflection/shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(100% 60% at 50% 10%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.0) 60%)',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 mt-3">
        <span>
          {ready ? (mode === 'mic' ? 'Mic live' : 'Audio element') : 'Initializing audio...'}
        </span>
        <span>
          sens {sensitivity} · rms {levelMv.get().toFixed(2)}
        </span>
      </div>
    </div>
  );
}
