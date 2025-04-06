import { useMemo } from 'react';
import { Clip } from '../Clip/ClipModel';
import { useVideoPanelViewModel } from './VideoPanel/VideoPanelViewModel';
import { useTimeRulerViewModel } from './TimeRuler/TimeRulerViewModel';
import { useTransportControlViewModel } from './TransportControl/TransportControlViewModel';

// Props for the Monitor view
export interface MonitorViewProps {
    title: string;
    currentClip: Clip | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    videoPanelProps: ReturnType<typeof useVideoPanelViewModel>;
    timeRulerProps: ReturnType<typeof useTimeRulerViewModel>;
    transportControlProps: ReturnType<typeof useTransportControlViewModel>;
    onDropClip?: (clip: Clip) => void;
}

// Pure transformation function
export const createMonitorViewProps = (
    title: string,
    currentClip: Clip | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number,
    videoPanelProps: ReturnType<typeof useVideoPanelViewModel>,
    timeRulerProps: ReturnType<typeof useTimeRulerViewModel>,
    transportControlProps: ReturnType<typeof useTransportControlViewModel>,
    onDropClip?: (clip: Clip) => void
): MonitorViewProps => ({
    title,
    currentClip,
    isPlaying,
    currentTime,
    duration,
    videoPanelProps,
    timeRulerProps,
    transportControlProps,
    onDropClip
});

// ViewModel hook
export const useMonitorViewModel = (
    title: string,
    currentClip: Clip | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number,
    onTimeUpdate: (time: number) => void,
    onPlay: () => void,
    onPause: () => void,
    onStepForward: () => void,
    onStepBackward: () => void,
    onDropClip?: (clip: Clip) => void
) => {
    // ViewModels for child components
    const videoPanelProps = useVideoPanelViewModel(currentClip, currentTime);
    const timeRulerProps = useTimeRulerViewModel(currentTime, duration, onTimeUpdate);
    const transportControlProps = useTransportControlViewModel(
        isPlaying,
        onPlay,
        onPause,
        onStepForward,
        onStepBackward
    );

    return useMemo(
        () => createMonitorViewProps(
            title,
            currentClip,
            isPlaying,
            currentTime,
            duration,
            videoPanelProps,
            timeRulerProps,
            transportControlProps,
            onDropClip
        ),
        [
            title,
            currentClip,
            isPlaying,
            currentTime,
            duration,
            videoPanelProps,
            timeRulerProps,
            transportControlProps,
            onDropClip
        ]
    );
}; 