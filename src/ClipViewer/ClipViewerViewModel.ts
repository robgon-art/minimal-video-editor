import { useState, useCallback, useEffect, useMemo } from 'react';
import { Clip, selectClipById, addClips } from '../Clip/ClipModel';
import { scanMediaFolder, importMediaFiles } from '../utils/MediaScanner';

// Props for the ClipViewer view
export interface ClipViewerViewProps {
    clips: Clip[];
    isLoading: boolean;
    errorMessage: string | null;
    onClipClick: (id: string) => void;
    onAddClips: () => void;
}

// Pure transformation function for state to props
export const createClipViewerProps = (
    clips: Clip[],
    isLoading: boolean,
    errorMessage: string | null,
    onClipClick: (id: string) => void,
    onAddClips: () => void
): ClipViewerViewProps => ({
    clips,
    isLoading,
    errorMessage,
    onClipClick,
    onAddClips
});

// ViewModel hook
export const useClipViewerViewModel = () => {
    // State
    const [clips, setClips] = useState<Clip[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load clips on mount by scanning the media folder
    useEffect(() => {
        const loadClips = async () => {
            try {
                setIsLoading(true);
                const loadedClips = await scanMediaFolder();
                setClips(loadedClips);
                setErrorMessage(null);
            } catch (error) {
                setErrorMessage('Failed to load clips from media folder');
            } finally {
                setIsLoading(false);
            }
        };

        loadClips();
    }, []);

    // Handler for clip selection
    const handleClipClick = useCallback((id: string) => {
        setClips(currentClips => selectClipById(currentClips, id));
    }, []);

    // Handler for adding new clips via file dialog
    const handleAddClips = useCallback(async () => {
        try {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = 'video/*';
            
            // When files are selected
            fileInput.onchange = async (event) => {
                try {
                    const target = event.target as HTMLInputElement;
                    if (!target.files || target.files.length === 0) {
                        return;
                    }
                    
                    setIsLoading(true);
                    
                    // Convert FileList to array of file paths
                    const filePaths = Array.from(target.files).map(file => 
                        URL.createObjectURL(file)
                    );
                    
                    // Import the media files
                    const newClips = await importMediaFiles(filePaths);
                    
                    // Add the new clips to state
                    setClips(currentClips => addClips(currentClips, newClips));
                    setErrorMessage(null);
                } catch (error) {
                    setErrorMessage('Failed to add clips');
                    console.error('Error adding clips:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            
            // Trigger the file dialog
            fileInput.click();
            
        } catch (error) {
            setErrorMessage('Failed to open file dialog');
            console.error('Error opening file dialog:', error);
        }
    }, []);

    // Create view props (memoized)
    return useMemo(() =>
        createClipViewerProps(
            clips,
            isLoading,
            errorMessage,
            handleClipClick,
            handleAddClips
        ),
        [clips, isLoading, errorMessage, handleClipClick, handleAddClips]
    );
}; 