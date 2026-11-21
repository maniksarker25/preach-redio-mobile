import type { VideoPlayer, VideoPlayerStatus } from 'expo-video';
import { useEffect, useState } from 'react';
import type { Podcast } from '@/types/models';

/**
 * How far a clip's shape may differ from the screen's and still fill it.
 * 1.3 ⇒ at most ~23% of the picture is cropped: 9:16 reels fill every phone
 * (≈18% cropped on a 19.5:9 screen), while 3:4, square and 16:9 are shown whole.
 */
const FILL_TOLERANCE = 1.3;
/** Give up measuring after this long and treat the clip as portrait. */
const MEASURE_TIMEOUT_MS = 2500;

/** width / height per clip, measured once per app session. */
const measured = new Map<string, number | null>();

/** True when the video (width / height = `aspect`) should fill a `w × h` page with `cover`. */
export const fillsScreen = (aspect: number | null | undefined, w: number, h: number) => {
  if (!aspect || !w || !h) return true; // unknown → assume a vertical reel
  const ratio = aspect / (w / h);
  return ratio <= FILL_TOLERANCE && ratio >= 1 / FILL_TOLERANCE;
};

/** The centred rectangle a video of `aspect` occupies inside a `w × h` page, uncropped. */
export const fitRect = (aspect: number, w: number, h: number) => {
  const width = aspect > w / h ? w : h * aspect;
  const height = width / aspect;
  return { position: 'absolute' as const, width, height, left: (w - width) / 2, top: (h - height) / 2 };
};

/**
 * The clip's display aspect ratio (rotation applied).
 *
 * Normally `videoWidth` / `videoHeight` from the API. For clips the backend hasn't
 * measured yet, a tiny thumbnail is read from the loaded video — thumbnails are
 * rotated like the picture, unlike the raw track size the player reports, which
 * shows most phone-recorded portrait clips as landscape.
 *
 * Returns `undefined` while measuring, `null` when unknown.
 */
export const useVideoAspect = (
  id: string,
  dims: Pick<Podcast, 'videoWidth' | 'videoHeight'>,
  player: VideoPlayer,
  status: VideoPlayerStatus,
  enabled: boolean,
): number | null | undefined => {
  const fromApi = dims.videoWidth && dims.videoHeight ? dims.videoWidth / dims.videoHeight : undefined;
  const [probed, setProbed] = useState<number | null | undefined>(() => measured.get(id));

  const needsProbe = enabled && fromApi === undefined && probed === undefined;
  useEffect(() => {
    if (!needsProbe || status !== 'readyToPlay') return;
    let done = false;
    const finish = (value: number | null) => {
      if (done) return;
      done = true;
      measured.set(id, value);
      setProbed(value);
    };
    const timer = setTimeout(() => finish(null), MEASURE_TIMEOUT_MS);
    player
      .generateThumbnailsAsync(0, { maxWidth: 48 })
      .then(([thumb]) => finish(thumb && thumb.width > 0 && thumb.height > 0 ? thumb.width / thumb.height : null))
      .catch(() => finish(null));
    return () => {
      done = true;
      clearTimeout(timer);
    };
  }, [id, needsProbe, player, status]);

  // Not a video, or it failed to load: nothing to measure, use the default (fill).
  if (!enabled || status === 'error') return null;
  return fromApi ?? probed;
};
