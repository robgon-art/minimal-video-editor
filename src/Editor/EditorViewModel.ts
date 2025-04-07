import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useClipViewerViewModel } from '../ClipViewer/ClipViewerViewModel';
import { useMonitorViewModel } from '../Monitor/MonitorViewModel';
import { Clip } from '../models/ClipModel';
import { VideoPanelRef } from '../Monitor/VideoPanel/VideoPanelView';

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
    // Don't destructure clips - access it directly to avoid stale closures

    // Find the selected clip
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
    // Separate state for the clip that's actually loaded in the monitor
    const [loadedClip, setLoadedClip] = useState<Clip | null>(null);

    // Create refs for video panels
    const sourceVideoRef = useRef<VideoPanelRef>(null);
    const programVideoRef = useRef<VideoPanelRef>(null);

    // Update selected clip when clips change, but don't load it into monitor
    useEffect(() => {
        const selected = clipViewerViewModel.clips.find(clip => clip.selected);
        setSelectedClip(selected || null);
        // Don't update loadedClip here - keep it separate from selection
    }, [clipViewerViewModel.clips]);

    // Handle single click (just select the clip but don't load it)
    const handleClipClick = useCallback((clipId: string) => {
        // Just call the original onClipClick to update selection in clip viewer
        console.log('Single click selecting clip, not loading into monitor');
        clipViewerViewModel.onClipClick(clipId);
    }, [clipViewerViewModel]);

    // Handle double click (load the clip into the monitor)
    const handleClipDoubleClick = useCallback((clip: Clip) => {
        // First, call the original onClipClick to update selection in clip viewer
        console.log('Double click loading clip into monitor:', clip.title);
        clipViewerViewModel.onClipClick(clip.id);

        // Load it into the monitor
        setLoadedClip(clip);
        // Reset playback position is now handled by the monitor view model
    }, [clipViewerViewModel]);

    // Handler for when a clip is dropped in the source monitor
    const handleDropInSourceMonitor = useCallback((droppedClip: Clip) => {
        // Find the clip in our list to ensure we have the latest version
        const clipInList = clipViewerViewModel.clips.find(clip => clip.id === droppedClip.id);

        if (clipInList) {
            // Set this clip as selected in the clip viewer
            clipViewerViewModel.onClipClick(clipInList.id);

            // Also load it into the monitor - make sure we preserve the thumbnail URLs
            const clipToLoad = {
                ...clipInList,
                // Preserve the thumbnailUrl from the dropped clip in case it has the correct path
                thumbnailUrl: droppedClip.thumbnailUrl || clipInList.thumbnailUrl,
                // Keep loadedThumbnailUrl if it exists
                loadedThumbnailUrl: droppedClip.loadedThumbnailUrl || clipInList.loadedThumbnailUrl
            };

            console.log('Loading clip into monitor with thumbnail:', clipToLoad.thumbnailUrl);

            setLoadedClip(clipToLoad);
            // Reset playback position is now handled by the monitor view model
        } else {
            console.warn("Dropped clip not found in clip list:", droppedClip);
        }
    }, [clipViewerViewModel]); // Only depend on clipViewerViewModel, not clips

    // Time update handlers
    const handleSourceTimeUpdate = useCallback((time: number) => {
        // Still useful to track time in the editor for potential timeline integration
        console.log('Source time updated:', time);
    }, []);

    const handleProgramTimeUpdate = useCallback((time: number) => {
        // Still useful to track time in the editor for potential timeline integration  
        console.log('Program time updated:', time);
    }, []);

    // Create monitor view models with our new signature
    const sourceMonitorProps = useMonitorViewModel(
        "Source",
        loadedClip,            // The clip to display
        false,                 // initialIsPlaying
        0,                     // initialCurrentTime
        loadedClip?.duration || 0, // duration
        handleSourceTimeUpdate, // onTimeUpdate
        handleDropInSourceMonitor, // onDropClip
        sourceVideoRef         // videoPanelRef
    );

    const programMonitorProps = useMonitorViewModel(
        "Program",
        null,                  // Program will eventually show the sequence
        false,                 // initialIsPlaying
        0,                     // initialCurrentTime 
        100,                   // Placeholder duration for now
        handleProgramTimeUpdate, // onTimeUpdate
        undefined,             // No drop handler for program
        programVideoRef        // videoPanelRef
    );

    // Create clipViewerProps with our custom handlers
    const clipViewerProps = useMemo(() => ({
        ...clipViewerViewModel,
        onClipClick: handleClipClick, // Override with our click handler
        onDoubleClick: handleClipDoubleClick // Add our double-click handler
    }), [clipViewerViewModel, handleClipClick, handleClipDoubleClick]);

    // App title
    const title = "Video Editor App";

    return useMemo(() =>
        createEditorViewProps(
            title,
            clipViewerProps,
            sourceMonitorProps,
            programMonitorProps
        ),
        [title, clipViewerProps, sourceMonitorProps, programMonitorProps]
    );
}; 