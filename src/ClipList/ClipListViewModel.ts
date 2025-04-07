import { useEffect, useState, useMemo } from 'react';
import { Clip } from '../Clip/ClipModel';
import { createThumbnailUrl } from '../services/media/MediaTransforms';

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
 * Hook to load real thumbnails for clips asynchronously
 */
export const useClipsWithThumbnails = (clips: Clip[]): ClipWithLoadedThumbnail[] => {
    const [clipsWithThumbnails, setClipsWithThumbnails] = useState<ClipWithLoadedThumbnail[]>([]);

    useEffect(() => {
        // Map original clips to our enhanced version
        const enhancedClips = clips.map(clip => ({
            ...clip,
            loadedThumbnailUrl: clip.thumbnailUrl // Start with placeholder
        }));

        setClipsWithThumbnails(enhancedClips);

        // For each clip that has a filePath, load its real thumbnail
        clips.forEach(async (clip, index) => {
            if (clip.filePath) {
                try {
                    // Get the real thumbnail URL
                    const thumbnailUrl = await createThumbnailUrl(clip.filePath);

                    // Update the specific clip with its real thumbnail
                    setClipsWithThumbnails(prevClips => {
                        const newClips = [...prevClips];
                        if (newClips[index]) {
                            newClips[index] = {
                                ...newClips[index],
                                loadedThumbnailUrl: thumbnailUrl
                            };
                        }
                        return newClips;
                    });
                } catch (error) {
                    console.error(`Error loading thumbnail for clip ${clip.id}:`, error);
                }
            }
        });
    }, [clips]);

    return clipsWithThumbnails;
}; 