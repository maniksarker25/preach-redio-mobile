import { useCallback, useEffect, useRef, useState } from 'react';
import { createMockEngine, type PlaybackEngine } from '@/services/playback/engine';

/**
 * Screen-scoped playback for video (sermons, reels). Uses the same engine
 * contract as the audio player; swap in an expo-video backed engine later.
 */
export const useLocalPlayback = (durationSec: number, options: { autoPlay?: boolean; loop?: boolean; url?: string } = {}) => {
  const { autoPlay = true, loop = false, url } = options;
  const engineRef = useRef<PlaybackEngine | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const engine = createMockEngine();
    engineRef.current = engine;
    engine.load({ url, durationSec, isLive: false });
    const offProgress = engine.onProgress(setPosition);
    const offEnded = engine.onEnded(() => {
      if (loop) {
        engine.seek(0);
        engine.play();
      } else setPlaying(false);
    });
    if (autoPlay) {
      engine.play();
      setPlaying(true);
    }
    return () => {
      offProgress();
      offEnded();
      engine.release();
      engineRef.current = null;
    };
  }, [autoPlay, durationSec, loop, url]);

  const play = useCallback(() => {
    engineRef.current?.play();
    setPlaying(true);
  }, []);
  const pause = useCallback(() => {
    engineRef.current?.pause();
    setPlaying(false);
  }, []);
  const toggle = useCallback(() => (playing ? pause() : play()), [pause, play, playing]);
  const seek = useCallback((s: number) => engineRef.current?.seek(s), []);
  const skipBy = useCallback((d: number) => engineRef.current?.seek(Math.max(0, Math.min(durationSec, position + d))), [durationSec, position]);

  return { playing, position, duration: durationSec, play, pause, toggle, seek, skipBy };
};
