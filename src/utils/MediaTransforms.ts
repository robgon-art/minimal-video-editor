/**
 * Pure transformations for media objects
 */
import { v4 as uuidv4 } from 'uuid';
import { MediaMetadata } from './MediaMetadata';
import { getFileName } from './PathUtils';

// Check if we have access to the Clip type
import { Clip } from '../Clip/ClipModel';

/**
 * Creates a clip object from file metadata and path
 */
export const fileToClip = (
    filePath: string,
    fileName: string,
    durationInSeconds: number
): Clip => {
    return {
        id: uuidv4(),
        title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
        thumbnailUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(fileName)}`,
        duration: durationInSeconds,
        filePath: filePath
    };
};

/**
 * Filters an array of files to only include supported media types
 */
export const filterSupportedFiles = (
    files: File[],
    supportedExtensions: string[]
): File[] => {
    return files.filter(file => {
        const fileName = file.name;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        return supportedExtensions.includes(extension);
    });
};

/**
 * Maps file paths to clip objects using provided metadata
 */
export const mapPathsToClips = (
    filePaths: string[],
    getMetadata: (path: string) => Promise<MediaMetadata>
): Promise<Clip[]> => {
    return Promise.all(
        filePaths.map(async (path) => {
            const metadata = await getMetadata(path);
            const fileName = getFileName(path);
            return fileToClip(path, fileName, metadata.durationInSeconds);
        })
    );
};

/**
 * Creates a thumbnail URL for a media file
 */
export const createThumbnailUrl = (fileName: string): string => {
    return `https://via.placeholder.com/150?text=${encodeURIComponent(fileName)}`;
}; 