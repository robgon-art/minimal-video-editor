import { joinPaths, getFileName } from '../path/PathUtils';
import { fileSystem } from '../../services/storage/FileSystem';
import {
    createReadOperation,
    createWriteOperation,
    createCreateDirectoryOperation
} from '../../services/storage/StorageOperations';
import { executeOperation } from '../../infrastructure/io/IOEffects';

// Constants
export const THUMBNAILS_FOLDER_PATH = '/media/thumbnails';

/**
 * Gets the thumbnail path for a given video file path
 */
export const getThumbnailPath = (videoPath: string): string => {
    const fileName = getFileName(videoPath);
    const baseName = fileName.split('.').slice(0, -1).join('.');
    return joinPaths(THUMBNAILS_FOLDER_PATH, `${baseName}.jpg`);
};

/**
 * Ensures the thumbnails directory exists
 */
export const ensureThumbnailsDirectoryExists = async (): Promise<void> => {
    try {
        const createDirOperation = createCreateDirectoryOperation(THUMBNAILS_FOLDER_PATH);
        await executeOperation<boolean>(fileSystem, createDirOperation);
    } catch (error) {
        // Directory might already exist, which is fine
        console.log('Thumbnails directory check:', error);
    }
};

/**
 * Check if running in a browser environment
 */
const isBrowser = (): boolean => {
    return typeof window !== 'undefined';
};

/**
 * Generate a thumbnail using browser APIs
 * @param videoPath Path to the video file
 * @param outputPath Path where the thumbnail should be saved
 * @returns Promise that resolves when thumbnail is generated
 */
export const generateThumbnail = async (videoPath: string, outputPath: string): Promise<boolean> => {
    if (!isBrowser()) {
        console.error("Thumbnail generation is only supported in browser environments");
        return false;
    }

    try {
        // First, ensure thumbnails directory exists
        await ensureThumbnailsDirectoryExists();

        // Read the video file data
        const readOperation = createReadOperation(videoPath);
        const { data } = await executeOperation<{ data: ArrayBuffer }>(fileSystem, readOperation);

        // Create a blob from the ArrayBuffer
        const blob = new Blob([data], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);

        // Create a video element to extract a frame
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'metadata';

        return new Promise((resolve, reject) => {
            // Once video metadata is loaded, seek to desired position and capture frame
            video.onloadedmetadata = () => {
                // Seek to 10% of the video duration
                video.currentTime = video.duration * 0.1;

                // When seeked, capture the frame
                video.onseeked = async () => {
                    try {
                        // Create canvas to draw the video frame
                        const canvas = document.createElement('canvas');
                        canvas.width = 320;
                        canvas.height = 240;
                        const ctx = canvas.getContext('2d');

                        if (!ctx) {
                            throw new Error('Could not get canvas context');
                        }

                        // Draw the video frame to the canvas
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        // Convert canvas to blob
                        const thumbnailBlob = await new Promise<Blob>((canvasResolve) => {
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    canvasResolve(blob);
                                } else {
                                    reject(new Error('Failed to create thumbnail blob'));
                                }
                            }, 'image/jpeg', 0.8);
                        });

                        // Convert blob to ArrayBuffer
                        const thumbnailArrayBuffer = await thumbnailBlob.arrayBuffer();

                        // Save the thumbnail
                        const writeOperation = createWriteOperation(
                            outputPath,
                            thumbnailArrayBuffer
                        );

                        await executeOperation<boolean>(fileSystem, writeOperation);

                        // Clean up
                        URL.revokeObjectURL(videoUrl);
                        resolve(true);
                    } catch (error) {
                        console.error('Error saving thumbnail:', error);
                        URL.revokeObjectURL(videoUrl);
                        reject(error);
                    }
                };
            };

            video.onerror = (e) => {
                console.error('Error loading video:', e);
                URL.revokeObjectURL(videoUrl);
                reject(new Error('Error loading video for thumbnail generation'));
            };

            // Start loading the video
            video.load();
        });
    } catch (error) {
        console.error('Error in thumbnail generation process:', error);
        return false;
    }
};

/**
 * Ensures a thumbnail exists for a video file, generating it if needed
 * @param videoPath Path to the video file
 * @returns Path to the thumbnail
 */
export const ensureThumbnailExists = async (videoPath: string): Promise<string> => {
    // If we're not in a browser, just return a placeholder
    if (!isBrowser()) {
        const fileName = getFileName(videoPath);
        return `https://via.placeholder.com/150?text=${encodeURIComponent(fileName)}`;
    }

    const thumbnailPath = getThumbnailPath(videoPath);

    try {
        // Try to read the thumbnail to check if it exists
        const readOperation = createReadOperation(thumbnailPath);
        await executeOperation(fileSystem, readOperation);
        // If we get here, the thumbnail exists
        return thumbnailPath;
    } catch (error) {
        // Thumbnail doesn't exist, generate it
        try {
            await generateThumbnail(videoPath, thumbnailPath);
            return thumbnailPath;
        } catch (thumbnailError) {
            console.error('Failed to generate thumbnail:', thumbnailError);
            // Return a placeholder if generation fails
            return `https://via.placeholder.com/150?text=${encodeURIComponent(getFileName(videoPath))}`;
        }
    }
}; 