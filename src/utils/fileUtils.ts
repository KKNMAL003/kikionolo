import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';
import { t } from './i18n';

type FileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
type FileInfo = {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType: string | null;
  fileType: FileType;
  extension: string;
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
const ARCHIVE_TYPES = [
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

/**
 * Get file type from MIME type
 */
const getFileType = (mimeType: string | null): FileType => {
  if (!mimeType) return 'other';
  
  if (IMAGE_TYPES.includes(mimeType)) return 'image';
  if (VIDEO_TYPES.includes(mimeType)) return 'video';
  if (AUDIO_TYPES.includes(mimeType)) return 'audio';
  if (DOCUMENT_TYPES.includes(mimeType)) return 'document';
  if (ARCHIVE_TYPES.includes(mimeType)) return 'archive';
  
  return 'other';
};

/**
 * Get file extension from URI or name
 */
const getFileExtension = (uri: string): string => {
  const match = /(\.\w+)(?:\?.*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : '';
};

/**
 * Get file info from URI
 */
export const getFileInfo = async (uri: string): Promise<FileInfo> => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  
  if (!fileInfo.exists) {
    throw new Error(t('errors.file.notFound'));
  }
  
  const fileName = uri.split('/').pop() || 'file';
  const extension = getFileExtension(fileName);
  const mimeType = await getMimeType(uri);
  
  return {
    uri,
    name: fileName,
    type: mimeType || 'application/octet-stream',
    size: fileInfo.size || 0,
    mimeType,
    fileType: getFileType(mimeType),
    extension,
  };
};

/**
 * Get MIME type from file URI
 */
export const getMimeType = async (uri: string): Promise<string | null> => {
  try {
    const response = await fetch(uri, { method: 'HEAD' });
    return response.headers.get('content-type');
  } catch (error) {
    console.warn('Failed to get MIME type:', error);
    return null;
  }
};

/**
 * Check if file size is within limits
 */
export const validateFileSize = (
  fileSize: number,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: t('errors.file.tooLarge', { size: maxSizeMB }),
    };
  }
  
  return { valid: true };
};

/**
 * Pick a document from the device
 */
export const pickDocument = async (options: DocumentPicker.DocumentPickerOptions = {}) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: Platform.OS === 'ios',
      ...options,
    });

    if (result.type === 'success') {
      return await getFileInfo(result.uri);
    }
    
    return null;
  } catch (error) {
    console.error('Error picking document:', error);
    throw new Error(t('errors.file.pickFailed'));
  }
};

/**
 * Pick an image from the device
 */
export const pickImage = async (options: ImagePicker.ImagePickerOptions = {}) => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error(t('errors.permissions.photoLibrary'));
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: false,
      ...options,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return await getFileInfo(asset.uri);
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw new Error(t('errors.file.pickImageFailed'));
  }
};

/**
 * Save file to device
 */
export const saveFile = async (
  fileUri: string,
  fileName?: string,
  options: { fileType?: string; directory?: string } = {}
): Promise<string> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error(t('errors.permissions.mediaLibrary'));
    }
    
    const fileInfo = await getFileInfo(fileUri);
    const asset = await MediaLibrary.createAssetAsync(fileUri);
    
    if (Platform.OS === 'android') {
      await MediaLibrary.createAlbumAsync('Download', asset, false);
    }
    
    return asset.uri;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error(t('errors.file.saveFailed'));
  }
};

/**
 * Download file from URL
 */
export const downloadFile = async (
  url: string,
  options: {
    headers?: Record<string, string>;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<string> => {
  try {
    const fileUri = `${FileSystem.cacheDirectory}${url.split('/').pop()}`;
    
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {
        headers: options.headers,
      },
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        options.onProgress?.(progress);
      }
    );
    
    const { uri } = await downloadResumable.downloadAsync();
    
    if (!uri) {
      throw new Error('Download failed: No URI returned');
    }
    
    return uri;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(t('errors.file.downloadFailed'));
  }
};

/**
 * Convert file to base64
 */
export const fileToBase64 = async (fileUri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return base64;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw new Error(t('errors.file.conversionFailed'));
  }
};

/**
 * Get file size in human-readable format
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get file icon based on file type
 */
export const getFileIcon = (fileType: FileType): string => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🔊',
    document: '📄',
    archive: '📦',
    other: '📁',
  };
  
  return icons[fileType] || icons.other;
};

export default {
  getFileInfo,
  getMimeType,
  validateFileSize,
  pickDocument,
  pickImage,
  saveFile,
  downloadFile,
  fileToBase64,
  formatFileSize,
  getFileIcon,
};
