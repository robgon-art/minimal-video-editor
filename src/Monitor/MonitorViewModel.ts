import { useMemo, RefObject, useState, useEffect, useCallback } from 'react';
import { Clip } from '../Clip/ClipModel';
import { useVideoPanelViewModel } from './VideoPanel/VideoPanelViewModel';
import { useTimeRulerViewModel } from './TimeRuler/TimeRulerViewModel';
import { useTransportControlViewModel } from './TransportControl/TransportControlViewModel';
import { VideoPanelRef } from './VideoPanel/VideoPanelView';

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
    videoPanelRef?: RefObject<VideoPanelRef>;
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
    onDropClip?: (clip: Clip) => void,
    videoPanelRef?: RefObject<VideoPanelRef>
): MonitorViewProps => ({
    title,
    currentClip,
    isPlaying,
    currentTime,
    duration,
    videoPanelProps,
    timeRulerProps,
    transportControlProps,
    onDropClip,
    videoPanelRef
});

// ViewModel hook
export const useMonitorViewModel = (
    title: string,
    currentClip: Clip | null,
    initialIsPlaying: boolean = false,
    initialCurrentTime: number = 0,
    duration: number = 0,
    onTimeUpdate?: (time: number) => void,
    onDropClip?: (clip: Clip) => void,
    videoPanelRef?: RefObject<VideoPanelRef>
) => {
    // Local state for playback status
    const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
    const [currentTime, setCurrentTime] = useState(initialCurrentTime);

    // Handler for time updates - both updates internal state and calls external handler
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
        if (onTimeUpdate) {
            onTimeUpdate(time);
        }
    }, [onTimeUpdate]);

    // Playback control handlers
    const handlePlay = useCallback(() => {
        if (videoPanelRef?.current) {
            videoPanelRef.current.play();
            setIsPlaying(true);
        }
    }, [videoPanelRef]);

    const handlePause = useCallback(() => {
        if (videoPanelRef?.current) {
            videoPanelRef.current.pause();
            setIsPlaying(false);
        }
    }, [videoPanelRef]);

    const handleStepForward = useCallback(() => {
        if (videoPanelRef?.current) {
            videoPanelRef.current.stepForward();
            setCurrentTime(videoPanelRef.current.getCurrentTime());
            if (onTimeUpdate) {
                onTimeUpdate(videoPanelRef.current.getCurrentTime());
            }
        }
    }, [videoPanelRef, onTimeUpdate]);

    const handleStepBackward = useCallback(() => {
        if (videoPanelRef?.current) {
            videoPanelRef.current.stepBackward();
            setCurrentTime(videoPanelRef.current.getCurrentTime());
            if (onTimeUpdate) {
                onTimeUpdate(videoPanelRef.current.getCurrentTime());
            }
        }
    }, [videoPanelRef, onTimeUpdate]);

    // ViewModels for child components
    const videoPanelProps = useVideoPanelViewModel(currentClip, currentTime);
    const timeRulerProps = useTimeRulerViewModel(currentTime, duration, handleTimeUpdate);
    const transportControlProps = useTransportControlViewModel(
        isPlaying,
        handlePlay,
        handlePause,
        handleStepForward,
        handleStepBackward
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
            onDropClip,
            videoPanelRef
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
            onDropClip,
            videoPanelRef
        ]
    );
}; 