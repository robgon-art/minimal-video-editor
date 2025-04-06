/**
 * Pure transformations for media objects
 */
import { MediaMetadata } from './MediaMetadata';
import { getFileName } from '../../utils/path/PathUtils';
import { Clip, createClipFromFile } from '../../Clip/ClipModel';
import { ensureThumbnailExists } from '../../utils/media/BrowserThumbnailGenerator';

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
 * @param filePath The path to the media file 
 * @returns A promise that resolves to the thumbnail URL
 */
export const createThumbnailUrl = async (filePath: string): Promise<string> => {
 
    try {
        // Generate or retrieve thumbnail path
        const thumbnailPath = await ensureThumbnailExists(filePath);
        return thumbnailPath;
    } catch (error) {
        // Fallback to local placeholder if thumbnail creation fails
        const fileName = getFileName(filePath);
        console.error(`Error creating thumbnail for ${fileName}:`, error);
        return '/video_clip.png';
    }
}; 