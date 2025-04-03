/**
 * Pure utility functions for handling media metadata
 */

// List of supported media file extensions
export const SUPPORTED_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];

/**
 * Checks if a file is a supported media type based on extension
 */
export const isSupportedMediaType = (extension: string): boolean => {
    return SUPPORTED_EXTENSIONS.includes(extension.toLowerCase());
};

/**
 * Validates if a file is a supported media type
 */
export const validateMediaFile = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return isSupportedMediaType(extension);
};

/**
 * Creates a metadata object with standard properties
 */
export const createMetadataObject = (
    size: number,
    lastModified: number | Date,
    durationInSeconds: number
): MediaMetadata => {
    return {
        size,
        lastModified: lastModified instanceof Date ? lastModified : new Date(lastModified),
        durationInSeconds: durationInSeconds || 0
    };
};

/**
 * MediaMetadata interface
 */
export interface MediaMetadata {
    size: number;
    lastModified: Date;
    durationInSeconds: number;
} 