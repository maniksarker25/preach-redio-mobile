import { createUploadTask, FileSystemSessionType, FileSystemUploadType, type UploadTask } from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef } from 'react';
import { useGetPresignedUrlMutation } from '@/store/api/creatorApi';
import type { UploadFileCategory } from '@/types/upload';

export interface S3UploadInput {
  uri: string;
  mimeType: string;
  category: UploadFileCategory;
  /** 0–1 */
  onProgress?: (ratio: number) => void;
}

export class UploadCancelledError extends Error {
  constructor() {
    super('Upload cancelled');
    this.name = 'UploadCancelledError';
  }
}

/**
 * Uploads local files straight to S3:
 * `POST /generate-presigned-url` → native streaming `PUT` (no file in JS memory,
 * progress events, continues while the app is in the background on iOS).
 *
 * The presigned URL expires after 60 s, so it is requested right before each PUT.
 * Returns `upload(input) → public URL` and `cancel()`; an unmounting screen cancels too.
 */
export const useS3Upload = () => {
  const [presign] = useGetPresignedUrlMutation();
  const task = useRef<UploadTask | null>(null);
  const cancelled = useRef(false);

  const cancel = useCallback(() => {
    cancelled.current = true;
    void task.current?.cancelAsync().catch(() => undefined);
  }, []);

  useEffect(() => cancel, [cancel]);

  const upload = useCallback(
    async ({ uri, mimeType, category, onProgress }: S3UploadInput) => {
      cancelled.current = false;
      const { uploadURL } = await presign({ fileType: mimeType, fileCategory: category }).unwrap();
      if (!uploadURL) throw new Error('Could not prepare the upload. Please try again.');
      if (cancelled.current) throw new UploadCancelledError();

      task.current = createUploadTask(
        uploadURL,
        uri,
        {
          httpMethod: 'PUT',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
          headers: { 'Content-Type': mimeType },
          sessionType: FileSystemSessionType.BACKGROUND,
        },
        ({ totalBytesSent, totalBytesExpectedToSend }) => {
          if (totalBytesExpectedToSend > 0) onProgress?.(Math.min(1, totalBytesSent / totalBytesExpectedToSend));
        },
      );

      let result;
      try {
        result = await task.current.uploadAsync();
      } catch (e) {
        if (cancelled.current) throw new UploadCancelledError();
        throw new Error('Upload failed. Check your connection and try again.', { cause: e });
      } finally {
        task.current = null;
      }
      if (cancelled.current || !result) throw new UploadCancelledError();
      if (result.status < 200 || result.status >= 300) throw new Error(`Upload failed (HTTP ${result.status}). Please try again.`);
      onProgress?.(1);
      // The object's public address is the URL without the signature; the backend maps it to the CDN.
      return uploadURL.split('?')[0]!;
    },
    [presign],
  );

  return { upload, cancel };
};
