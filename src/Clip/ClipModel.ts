import { v4 as uuidv4 } from 'uuid';
import { mediaService } from '../services/media/MediaServiceInstance';

export interface Clip {
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: number; // in seconds
    fps?: number; // frames per second, defaults to 24 if not specified
    selected?: boolean;
    filePath?: string; // Path to the actual media file
    loadedThumbnailUrl?: string; // Loaded thumbnail blob URL
    mediaUrl?: string; // URL to the media file (used by REST service)
}

/**
 * Creates a clip object from file metadata and path
 * @param filePath The path to the media file
 * @param fileName The name of the file
 * @param durationInSeconds The duration of the media in seconds
 * @param fps The frames per second (optional, defaults to 24)
 * @returns A new Clip object
 */
export const createClipFromFile = (
    filePath: string,
    fileName: string,
    durationInSeconds: number,
    fps: number = 24
): Clip => {
    // Default values in case of errors
    let thumbnailUrl = '/video_clip.png';
    let mediaUrl = filePath;

    try {
        // Always try to get URLs from the media service
        thumbnailUrl = mediaService.getThumbnailUrl(filePath);
        mediaUrl = mediaService.getMediaUrl(filePath);
    } catch (e) {
        console.log('Using default thumbnail and media paths (service may not be available)');
    }

    return {
        id: uuidv4(),
        title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
        thumbnailUrl: thumbnailUrl,
        duration: durationInSeconds,
        fps: fps,
        filePath: filePath,
        mediaUrl: mediaUrl
    };
};

// Pure functions for clip operations
export const selectClip = (clip: Clip): Clip => ({
    ...clip,
    selected: true
});

export const deselectClip = (clip: Clip): Clip => ({
    ...clip,
    selected: false
});

export const updateClipTitle = (clip: Clip, title: string): Clip => ({
    ...clip,
    title
});

// Pure filter/map/reduce operations on collections of clips
export const selectClipById = (clips: Clip[], id: string): Clip[] =>
    clips.map(clip => clip.id === id ? selectClip(clip) : deselectClip(clip));

export const getSelectedClips = (clips: Clip[]): Clip[] =>
    clips.filter(clip => clip.selected);

export const getTotalDuration = (clips: Clip[]): number =>
    clips.reduce((total, clip) => total + clip.duration, 0);

// Add clip function - pure, doesn't perform side effects
export const addClip = (clips: Clip[], clip: Clip): Clip[] =>
    [...clips, clip];

// Add multiple clips at once - pure, doesn't perform side effects
export const addClips = (clips: Clip[], newClips: Clip[]): Clip[] =>
    [...clips, ...newClips];

// Function to check if a clip with the same name already exists
export const clipExists = (clips: Clip[], title: string): boolean =>
    clips.some(clip => clip.title.toLowerCase() === title.toLowerCase()); 