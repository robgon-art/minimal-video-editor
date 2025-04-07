export interface Clip {
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: number; // in seconds
    selected?: boolean;
    filePath?: string; // Path to the media file
    loadedThumbnailUrl?: string; // Loaded thumbnail blob URL
}

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