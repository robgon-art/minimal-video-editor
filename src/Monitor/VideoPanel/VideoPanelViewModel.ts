import { useMemo } from 'react';
import { Clip } from '../../models/ClipModel';

// Props for the VideoPanel view
export interface VideoPanelViewProps {
    clip: Clip | null;
    currentTime: number;
    timecode: string;
}

// Pure transformation function to format timecode (HH:MM:SS:FF)
export const formatTimecode = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 24); // Assuming 24fps

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

// Pure transformation function
export const createVideoPanelViewProps = (
    clip: Clip | null,
    currentTime: number
): VideoPanelViewProps => ({
    clip,
    currentTime,
    timecode: formatTimecode(currentTime)
});

// ViewModel hook
export const useVideoPanelViewModel = (
    clip: Clip | null,
    currentTime: number
) => {
    return useMemo(
        () => createVideoPanelViewProps(clip, currentTime),
        [clip, currentTime]
    );
}; 