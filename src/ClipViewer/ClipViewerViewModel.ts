import { useState, useCallback, useEffect, useMemo } from 'react';
import { Clip, selectClipById } from '../models/ClipModel';
import { fetchClips, createClip } from '../models/ClipService';

// Props for the ClipViewer view
export interface ClipViewerViewProps {
    clips: Clip[];
    isLoading: boolean;
    errorMessage: string | null;
    onClipClick: (id: string) => void;
    onAddClip: () => void;
}

// Pure transformation function for state to props
export const createClipViewerProps = (
    clips: Clip[],
    isLoading: boolean,
    errorMessage: string | null,
    onClipClick: (id: string) => void,
    onAddClip: () => void
): ClipViewerViewProps => ({
    clips,
    isLoading,
    errorMessage,
    onClipClick,
    onAddClip
});

// ViewModel hook
export const useClipViewerViewModel = () => {
    // State
    const [clips, setClips] = useState<Clip[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load clips on mount
    useEffect(() => {
        const loadClips = async () => {
            try {
                setIsLoading(true);
                const loadedClips = await fetchClips();
                setClips(loadedClips);
                setErrorMessage(null);
            } catch (error) {
                setErrorMessage('Failed to load clips');
            } finally {
                setIsLoading(false);
            }
        };

        loadClips();
    }, []);

    // Handler for click events
    const handleClipClick = useCallback((id: string) => {
        setClips(currentClips => selectClipById(currentClips, id));
    }, []);

    // Handler for adding a new clip
    const handleAddClip = useCallback(async () => {
        try {
            setIsLoading(true);
            const newClip = await createClip(`New Clip ${clips.length + 1}`);
            setClips(currentClips => [...currentClips, newClip]);
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage('Failed to add clip');
        } finally {
            setIsLoading(false);
        }
    }, [clips.length]);

    // Create view props (memoized)
    return useMemo(() =>
        createClipViewerProps(
            clips,
            isLoading,
            errorMessage,
            handleClipClick,
            handleAddClip
        ),
        [clips, isLoading, errorMessage, handleClipClick, handleAddClip]
    );
}; 