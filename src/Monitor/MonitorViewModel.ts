import { useMemo } from 'react';
import { Clip } from '../models/ClipModel';
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
    onTimeUpdate: (time: number) => void;
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
    onTimeUpdate: (time: number) => void
): MonitorViewProps => ({
    title,
    currentClip,
    isPlaying,
    currentTime,
    duration,
    videoPanelProps,
    timeRulerProps,
    transportControlProps,
    onTimeUpdate
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
    onStepBackward: () => void
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
            onTimeUpdate
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
            onTimeUpdate
        ]
    );
}; 