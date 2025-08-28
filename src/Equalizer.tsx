import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Framer Motion Equalizer for a live audio stream (mic or <audio> element)
 * -----------------------------------------------------------------------
 * - Uses Web Audio API (AnalyserNode) to read frequency data
 * - Streams values to Framer Motion MotionValues (no extra re-renders)
 * - Smooth springs for each bar
 *
 * Props:
 *  - mode: "mic" | "element" (default: "element")
 *  - audioEl?: HTMLAudioElement | null (required if mode === "element")
 *  - bars?: number (default: 32)
 *  - fftSize?: 256 | 512 | 1024 | 2048 (default: 1024)
 *  - smoothing?: number (0..1, default: 0.85)
 *  - height?: number (px, default: 160)
 *  - width?: number (px, default: 480)
 *  - colorClass?: string (Tailwind class for bar color)
 *  - bgClass?: string (Tailwind class for background)
 *
 * Usage (element):
 *  const ref = useRef<HTMLAudioElement>(null)
 *  <>
 *    <audio ref={ref} src="/song.mp3" controls/>
 *    <Equalizer mode="element" audioEl={ref.current} />
 *  </>
 *
 * Usage (mic):
 *  <Equalizer mode="mic" />
 */

type EqualizerProps = {
  mode?: 'mic' | 'element';
  audioEl?: HTMLAudioElement | null;
  bars?: number;
  fftSize?: 256 | 512 | 1024 | 2048;
  smoothing?: number; // 0..1
  height?: number;
  width?: number;
  colorClass?: string;
  bgClass?: string;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function Equalizer({
  mode = 'element',
  audioEl = null,
  bars = 32,
  fftSize = 1024,
  smoothing = 0.85,
  height = 160,
  width = 480,
  colorClass = 'bg-indigo-500',
  bgClass = 'bg-zinc-900',
}: EqualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);

  // Use state to track bar heights and avoid hook violations
  const [barHeights, setBarHeights] = useState<number[]>(() => Array(bars).fill(0));

  // Compute index ranges to aggregate FFT bins into N bars (log-scale-ish)
  const binMap = useMemo(() => {
    // Build logarithmic mapping so low frequencies have more resolution
    const map: Array<{ start: number; end: number }> = [];
    const size = fftSize / 2; // frequencyBinCount
    const minIdx = 2; // skip DC & ultra-low
    const maxIdx = size - 1;

    for (let i = 0; i < bars; i++) {
      const t0 = i / bars;
      const t1 = (i + 1) / bars;
      // Exponential spacing
      const start = Math.floor(minIdx + ((Math.pow(10, t0) - 1) / (10 - 1)) * (maxIdx - minIdx));
      const end = Math.floor(minIdx + ((Math.pow(10, t1) - 1) / (10 - 1)) * (maxIdx - minIdx));
      map.push({ start: clamp(start, minIdx, maxIdx), end: clamp(end, minIdx + 1, maxIdx) });
    }
    return map;
  }, [bars, fftSize]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      // Create/reuse AudioContext
      const ctx =
        ctxRef.current ??
        new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      ctxRef.current = ctx;

      // Create analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize; // 2^n, 32..32768
      analyser.smoothingTimeConstant = smoothing;
      analyserRef.current = analyser;

      // Connect source
      let source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null;

      if (mode === 'element') {
        if (!audioEl) return;
        // If element is not playing yet, resume context on user gesture is needed in some browsers
        source = ctx.createMediaElementSource(audioEl);
        source.connect(analyser);
        analyser.connect(ctx.destination); // to hear audio
      } else {
        // mic
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        // Do not connect analyser to destination to avoid feedback
      }

      srcRef.current = source;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        console.log('---> loop', buffer);
        if (cancelled) return;
        analyser.getByteFrequencyData(buffer); // 0..255

        // Array to store new heights for this frame
        const newHeights: number[] = [];

        // Aggregate bins into bars
        for (let i = 0; i < bars; i++) {
          const { start, end } = binMap[i];
          let sum = 0;
          let count = 0;
          for (let j = start; j < end; j++) {
            sum += buffer[j];
            count++;
          }
          const avg = count ? sum / count : 0;
          const norm = avg / 255; // 0..1
          const barPx = norm * height; // scale to container height
          // Store the values to update state
          newHeights[i] = barPx;
        }

        // Update state with new heights
        setBarHeights(newHeights);

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Disconnect nodes but keep AudioContext for reuse
      srcRef.current?.disconnect();
      analyserRef.current?.disconnect();
    };
  }, [mode, audioEl, bars, fftSize, smoothing, height, binMap]);

  const gap = 4; // px gap between bars
  const barWidth = Math.floor((width - gap * (bars - 1)) / bars);

  // console.log('---> barHeights', barHeights);

  return (
    <div
      className={`w-full flex flex-col items-center ${bgClass} rounded-2xl p-4`}
      style={{ width }}
    >
      <div className="w-full flex items-end" style={{ height, gap }} ref={containerRef}>
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            className={`${colorClass} rounded-t-xl`}
            style={{
              width: barWidth,
              transformOrigin: 'bottom',
            }}
            animate={{ height: h }}
            initial={{ height: 22 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400 w-full mt-2">
        <span>{mode === 'mic' ? 'Mic live' : 'Audio element'}</span>
        <span>
          {bars} bars · fft {fftSize}
        </span>
      </div>
    </div>
  );
}
