import { useMemo } from 'react';
import { Clip } from '../../Clip/ClipModel';

/**
 * View model props for the video panel
 */
export interface VideoPanelViewProps {
    /** Current clip being displayed */
    clip: any;
    /** Current time position in seconds */
    currentTime: number;
    /** Formatted timecode string */
    timecode: string;
    /** Optional test environment configuration for testing */
    testEnv?: {
        /** Maximum number of retries for loading video */
        maxRetries?: number;
        /** Flag to prevent fallback to direct URL in tests */
        preventFallback?: boolean;
    };
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