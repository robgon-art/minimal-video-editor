/**
 * Pure transformations for media objects
 */
import { MediaMetadata } from './MediaMetadata';
import { getFileName } from './PathUtils';
import { Clip, createClipFromFile } from '../Clip/ClipModel';

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
            return createClipFromFile(path, fileName, metadata.durationInSeconds);
        })
    );
};

/**
 * Creates a thumbnail URL for a media file
 */
export const createThumbnailUrl = (fileName: string): string => {
    return `https://via.placeholder.com/150?text=${encodeURIComponent(fileName)}`;
}; 