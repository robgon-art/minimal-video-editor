import { useMemo } from 'react';
import { Clip } from '../models/ClipModel';

// Props expected by the ClipList view
export interface ClipListViewProps {
    clips: Clip[];
    onClipClick: (id: string) => void;
}

// Pure function to create view props (can be tested independently of React)
export const createClipListViewProps = (
    clips: Clip[],
    onClipClick: (id: string) => void
): ClipListViewProps => ({
    clips,
    onClipClick
});

// Hook that wraps view props generation
export const useClipListViewModel = (
    clips: Clip[],
    onClipClick: (id: string) => void
): ClipListViewProps => {
    return useMemo(() =>
        createClipListViewProps(clips, onClipClick),
        [clips, onClipClick]
    );
}; 