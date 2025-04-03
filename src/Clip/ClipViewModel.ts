import { useMemo } from 'react';
import { Clip } from '../models/ClipModel';

// Props that the View expects from the ViewModel
export interface ClipViewProps {
    title: string;
    thumbnailUrl: string;
    isSelected: boolean;
    onClick: () => void;
}

// Pure function to transform a model into view props (no hooks, easily testable)
export const createClipViewProps = (
    clip: Clip,
    onClipClick: (id: string) => void
): ClipViewProps => ({
    title: clip.title,
    thumbnailUrl: clip.thumbnailUrl,
    isSelected: clip.selected || false,
    onClick: () => onClipClick(clip.id)
});

// Hook that creates the view props from a clip and click handler
export const useClipViewModel = (
    clip: Clip,
    onClipClick: (id: string) => void
): ClipViewProps => {
    // Use memoization to prevent unnecessary re-renders
    return useMemo(() =>
        createClipViewProps(clip, onClipClick),
        [clip, onClipClick]
    );
}; 