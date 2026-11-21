import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  /** seconds, when the picker reports it (videos) */
  duration?: number;
  /** pixels, for videos */
  width?: number;
  height?: number;
}

/** Pick a square image (avatars, covers). Returns null when cancelled. */
export const pickImage = async (aspect: [number, number] = [1, 1]): Promise<PickedFile | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.85 });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, name: asset.fileName ?? 'image.jpg', mimeType: asset.mimeType, size: asset.fileSize } : null;
};

export const pickVideo = async (): Promise<PickedFile | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset
    ? {
        uri: asset.uri,
        name: asset.fileName ?? 'video.mp4',
        mimeType: asset.mimeType,
        size: asset.fileSize,
        duration: asset.duration ? asset.duration / 1000 : undefined,
        width: asset.width || undefined,
        height: asset.height || undefined,
      }
    : null;
};

export const pickAudio = async (): Promise<PickedFile | null> => {
  const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size } : null;
};

export const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
