import { useMemo } from 'react';

// Props for the TransportControl view
export interface TransportControlViewProps {
    isPlaying: boolean;
    onPlayPauseClick: () => void;
    onStepForwardClick: () => void;
    onStepBackwardClick: () => void;
}

// Pure transformation function
export const createTransportControlViewProps = (
    isPlaying: boolean,
    onPlay: () => void,
    onPause: () => void,
    onStepForward: () => void,
    onStepBackward: () => void
): TransportControlViewProps => {
    // Combined play/pause handler
    const onPlayPauseClick = () => {
        if (isPlaying) {
            onPause();
        } else {
            onPlay();
        }
    };

    return {
        isPlaying,
        onPlayPauseClick,
        onStepForwardClick: onStepForward,
        onStepBackwardClick: onStepBackward
    };
};

// ViewModel hook
export const useTransportControlViewModel = (
    isPlaying: boolean,
    onPlay: () => void,
    onPause: () => void,
    onStepForward: () => void,
    onStepBackward: () => void
) => {
    return useMemo(
        () => createTransportControlViewProps(
            isPlaying,
            onPlay,
            onPause,
            onStepForward,
            onStepBackward
        ),
        [isPlaying, onPlay, onPause, onStepForward, onStepBackward]
    );
}; 