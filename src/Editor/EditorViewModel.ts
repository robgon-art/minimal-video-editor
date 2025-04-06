import { useMemo, useState, useCallback, useEffect } from 'react';
import { useClipViewerViewModel } from '../ClipViewer/ClipViewerViewModel';
import { useMonitorViewModel } from '../Monitor/MonitorViewModel';
import { Clip } from '../models/ClipModel';

// Props for the Editor view
export interface EditorViewProps {
    title: string;
    clipViewerProps: ReturnType<typeof useClipViewerViewModel>;
    sourceMonitorProps: ReturnType<typeof useMonitorViewModel>;
    programMonitorProps: ReturnType<typeof useMonitorViewModel>;
}

// Pure transformation function
export const createEditorViewProps = (
    title: string,
    clipViewerProps: ReturnType<typeof useClipViewerViewModel>,
    sourceMonitorProps: ReturnType<typeof useMonitorViewModel>,
    programMonitorProps: ReturnType<typeof useMonitorViewModel>
): EditorViewProps => ({
    title,
    clipViewerProps,
    sourceMonitorProps,
    programMonitorProps
});

// ViewModel hook
export const useEditorViewModel = () => {
    // Get clip viewer view model
    const clipViewerViewModel = useClipViewerViewModel();
    const { clips } = clipViewerViewModel;

    // Find the selected clip
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

    // Update selected clip when clips change
    useEffect(() => {
        const selected = clips.find(clip => clip.selected);
        setSelectedClip(selected || null);
    }, [clips]);

    // Monitor state
    const [sourceIsPlaying, setSourceIsPlaying] = useState(false);
    const [sourceCurrentTime, setSourceCurrentTime] = useState(0);
    const [programIsPlaying, setProgramIsPlaying] = useState(false);
    const [programCurrentTime, setProgramCurrentTime] = useState(0);

    // Source monitor handlers
    const handleSourceTimeUpdate = useCallback((time: number) => {
        setSourceCurrentTime(time);
    }, []);

    const handleSourcePlay = useCallback(() => {
        setSourceIsPlaying(true);
    }, []);

    const handleSourcePause = useCallback(() => {
        setSourceIsPlaying(false);
    }, []);

    const handleSourceStepForward = useCallback(() => {
        setSourceCurrentTime(prev => Math.min(prev + 1 / 24, selectedClip?.duration || 0));
    }, [selectedClip]);

    const handleSourceStepBackward = useCallback(() => {
        setSourceCurrentTime(prev => Math.max(prev - 1 / 24, 0));
    }, []);

    // Program monitor handlers
    const handleProgramTimeUpdate = useCallback((time: number) => {
        setProgramCurrentTime(time);
    }, []);

    const handleProgramPlay = useCallback(() => {
        setProgramIsPlaying(true);
    }, []);

    const handleProgramPause = useCallback(() => {
        setProgramIsPlaying(false);
    }, []);

    const handleProgramStepForward = useCallback(() => {
        setProgramCurrentTime(prev => prev + 1 / 24);
    }, []);

    const handleProgramStepBackward = useCallback(() => {
        setProgramCurrentTime(prev => Math.max(prev - 1 / 24, 0));
    }, []);

    // Reset source time when selected clip changes
    useEffect(() => {
        setSourceCurrentTime(0);
        setSourceIsPlaying(false);
    }, [selectedClip]);

    // Create monitor view models
    const sourceMonitorProps = useMonitorViewModel(
        "Source",
        selectedClip,
        sourceIsPlaying,
        sourceCurrentTime,
        selectedClip?.duration || 0,
        handleSourceTimeUpdate,
        handleSourcePlay,
        handleSourcePause,
        handleSourceStepForward,
        handleSourceStepBackward
    );

    const programMonitorProps = useMonitorViewModel(
        "Program",
        null, // Program will eventually show the sequence
        programIsPlaying,
        programCurrentTime,
        100, // Placeholder duration for now
        handleProgramTimeUpdate,
        handleProgramPlay,
        handleProgramPause,
        handleProgramStepForward,
        handleProgramStepBackward
    );

    // App title
    const title = "Video Editor App";

    return useMemo(() =>
        createEditorViewProps(
            title,
            clipViewerViewModel,
            sourceMonitorProps,
            programMonitorProps
        ),
        [title, clipViewerViewModel, sourceMonitorProps, programMonitorProps]
    );
}; 