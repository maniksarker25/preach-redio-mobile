import { createAudioPlayer } from 'expo-audio';

const MIME_BY_EXT: Record<string, string> = {
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/**
 * A reliable `Content-Type` for a local file. The presigned URL is signed with it and
 * the backend derives the S3 file extension from it, so guesses like `audio/x-m4a`
 * are normalised.
 */
export const mimeFor = (uri: string, reported?: string | null, fallback = 'application/octet-stream') => {
  const ext = uri.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
  const fromExt = MIME_BY_EXT[ext];
  if (reported === 'audio/x-m4a' || reported === 'audio/m4a') return 'audio/mp4';
  if (reported && /^(audio|video|image)\/[\w.+-]+$/.test(reported)) return reported;
  return fromExt ?? fallback;
};

/**
 * Length of a local audio file in seconds, read by loading it into a (silent) player.
 * Resolves `undefined` if the file can't be read within `timeoutMs`.
 */
export const probeAudioDuration = (uri: string, timeoutMs = 8000): Promise<number | undefined> =>
  new Promise((resolve) => {
    const player = createAudioPlayer(uri);
    let settled = false;
    const finish = (value?: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub.remove();
      player.release();
      resolve(value && Number.isFinite(value) && value > 0 ? value : undefined);
    };
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.duration > 0) finish(status.duration);
    });
    const timer = setTimeout(() => finish(player.duration), timeoutMs);
  });

/** "45:20" / "1:02:03" → seconds (0 when invalid). */
export const parseClock = (v: string) => {
  const parts = v.trim().split(':').map((n) => Number(n));
  if (!parts.length || parts.some((n) => Number.isNaN(n) || n < 0)) return 0;
  return Math.round(parts.reduce((acc, n) => acc * 60 + n, 0));
};

/** Backend legacy `duration` ("minutes.seconds": 4m 07s → 4.07). */
export const legacyDuration = (seconds: number) => Math.floor(seconds / 60) + (Math.round(seconds) % 60) / 100;
