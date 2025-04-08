import { useEffect, useState, useMemo } from 'react';
import { Clip } from '../Clip/ClipModel';

// Props expected by the ClipList view
export interface ClipListViewProps {
    clips: Clip[];
    onClipClick: (id: string) => void;
    onDoubleClick?: (clip: Clip) => void;
}

// Pure function to create view props (can be tested independently of React)
export const createClipListViewProps = (
    clips: Clip[],
    onClipClick: (id: string) => void,
    onDoubleClick?: (clip: Clip) => void
): ClipListViewProps => ({
    clips,
    onClipClick,
    onDoubleClick
});

// Hook that wraps view props generation
export const useClipListViewModel = (
    clips: Clip[],
    onClipClick: (id: string) => void,
    onDoubleClick?: (clip: Clip) => void
): ClipListViewProps => {
    return useMemo(() =>
        createClipListViewProps(clips, onClipClick, onDoubleClick),
        [clips, onClipClick, onDoubleClick]
    );
};

export interface ClipWithLoadedThumbnail extends Clip {
    loadedThumbnailUrl: string;
}

/**
 * Hook to prepare clips with thumbnails
 */
export const useClipsWithThumbnails = (clips: Clip[]): ClipWithLoadedThumbnail[] => {
    const [clipsWithThumbnails, setClipsWithThumbnails] = useState<ClipWithLoadedThumbnail[]>([]);

    useEffect(() => {
        // Map original clips to our enhanced version
        const enhancedClips = clips.map(clip => ({
            ...clip,
            // With REST service, we can just use the thumbnailUrl directly
            loadedThumbnailUrl: clip.thumbnailUrl
        }));

        setClipsWithThumbnails(enhancedClips);
    }, [clips]);

    return clipsWithThumbnails;
}; 