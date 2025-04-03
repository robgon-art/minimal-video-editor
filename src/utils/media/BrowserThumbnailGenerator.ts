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

// Cache for thumbnail blob URLs
const thumbnailCache = new Map<string, string>();

// Track in-flight thumbnail generation requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Gets the thumbnail path for a given video file path
 */
export const getThumbnailPath = (videoPath: string): string => {
    const fileName = getFileName(videoPath);
    // Normalize the base name by replacing spaces and special characters with underscores
    const baseName = fileName.split('.').slice(0, -1).join('.').replace(/\s+/g, '_');
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
 * @returns Promise that resolves when thumbnail is generated with the blob URL
 */
export const generateThumbnail = async (videoPath: string, outputPath: string): Promise<{ success: boolean, blobUrl?: string }> => {
    if (!isBrowser()) {
        console.error("Thumbnail generation is only supported in browser environments");
        return { success: false };
    }

    try {
        console.log('Starting thumbnail generation for video:', videoPath);
        console.log('Target thumbnail path:', outputPath);

        // First, ensure thumbnails directory exists
        console.log('Ensuring thumbnails directory exists...');
        await ensureThumbnailsDirectoryExists();
        console.log('Thumbnails directory check complete');

        // Read the video file data
        console.log('Reading video file data...');
        const readOperation = createReadOperation(videoPath);
        const { data } = await executeOperation<{ data: ArrayBuffer }>(fileSystem, readOperation);
        console.log('Successfully read video file, size:', data.byteLength, 'bytes');

        // Create a blob from the ArrayBuffer
        const blob = new Blob([data], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        console.log('Created video blob URL:', videoUrl);

        // Create a video element to extract a frame
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'metadata';
        console.log('Created video element with source');

        return new Promise((resolve, reject) => {
            // Once video metadata is loaded, seek to desired position and capture frame
            video.onloadedmetadata = () => {
                console.log('Video metadata loaded. Duration:', video.duration, 'seconds');
                // Seek to 10% of the video duration
                const seekTime = video.duration * 0.1;
                console.log('Seeking to position:', seekTime, 'seconds');
                video.currentTime = seekTime;

                // When seeked, capture the frame
                video.onseeked = async () => {
                    try {
                        console.log('Video seeked successfully, capturing frame...');
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
                        console.log('Frame drawn to canvas');

                        // Convert canvas to blob
                        console.log('Converting canvas to blob...');
                        const thumbnailBlob = await new Promise<Blob>((canvasResolve) => {
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    console.log('Successfully created thumbnail blob, size:', blob.size, 'bytes');
                                    canvasResolve(blob);
                                } else {
                                    reject(new Error('Failed to create thumbnail blob'));
                                }
                            }, 'image/jpeg', 0.8);
                        });

                        // Create a blob URL for immediate display
                        const blobUrl = URL.createObjectURL(thumbnailBlob);
                        // Cache the blob URL
                        thumbnailCache.set(videoPath, blobUrl);
                        console.log('Created and cached blob URL for UI:', blobUrl);

                        // Convert blob to ArrayBuffer
                        console.log('Converting blob to ArrayBuffer...');
                        const thumbnailArrayBuffer = await thumbnailBlob.arrayBuffer();
                        console.log('Thumbnail ArrayBuffer created, size:', thumbnailArrayBuffer.byteLength, 'bytes');

                        // Save the thumbnail
                        console.log('Saving thumbnail to:', outputPath);
                        const writeOperation = createWriteOperation(
                            outputPath,
                            thumbnailArrayBuffer
                        );

                        await executeOperation<boolean>(fileSystem, writeOperation);
                        console.log('Thumbnail saved successfully');

                        // Clean up
                        URL.revokeObjectURL(videoUrl);
                        console.log('Cleaned up video URL');
                        resolve({ success: true, blobUrl });
                    } catch (error) {
                        console.error('Error in frame capture process:', error);
                        URL.revokeObjectURL(videoUrl);
                        reject(error);
                    }
                };
            };

            video.onerror = (e) => {
                console.error('Video element error:', e);
                console.error('Video error details:', video.error);
                URL.revokeObjectURL(videoUrl);
                reject(new Error('Error loading video for thumbnail generation'));
            };

            // Start loading the video
            console.log('Starting video load...');
            video.load();
        });
    } catch (error) {
        console.error('Error in thumbnail generation process:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        return { success: false };
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
        return '/video_clip.png';
    }

    // Check if we have a request already in progress for this video
    if (inFlightRequests.has(videoPath)) {
        console.log('Reusing in-flight thumbnail generation request for:', videoPath);
        return inFlightRequests.get(videoPath)!;
    }

    // Check if we have a cached blob URL
    if (thumbnailCache.has(videoPath)) {
        console.log('Using cached thumbnail blob URL');
        return thumbnailCache.get(videoPath) as string;
    }

    const thumbnailPath = getThumbnailPath(videoPath);

    // Create a promise for the thumbnail generation and store it in the in-flight map
    const thumbnailPromise = (async () => {
        try {
            // Ensure thumbnails directory exists first
            await ensureThumbnailsDirectoryExists();

            // Try to read the thumbnail to check if it exists
            try {
                const readOperation = createReadOperation(thumbnailPath);
                const { data } = await executeOperation<{ data: ArrayBuffer }>(fileSystem, readOperation);

                // Create and cache blob URL from the existing file
                const blob = new Blob([data], { type: 'image/jpeg' });
                const blobUrl = URL.createObjectURL(blob);
                thumbnailCache.set(videoPath, blobUrl);
                console.log('Created and cached blob URL from existing thumbnail file:', blobUrl);

                return blobUrl;
            } catch (readError) {
                console.log('Thumbnail not found, generating new one');
                // Thumbnail doesn't exist, generate it
                const result = await generateThumbnail(videoPath, thumbnailPath);
                if (result.success && result.blobUrl) {
                    return result.blobUrl;
                }
                console.error('Failed to generate thumbnail, using placeholder');
                // Return local placeholder if generation fails
                return '/video_clip.png';
            }
        } catch (error) {
            console.error('Error in ensureThumbnailExists:', error);
            // Return local placeholder if any error occurs
            return '/video_clip.png';
        } finally {
            // Remove this request from the in-flight map when done
            inFlightRequests.delete(videoPath);
        }
    })();

    // Store the promise in the in-flight requests map
    inFlightRequests.set(videoPath, thumbnailPromise);

    return thumbnailPromise;
}; 