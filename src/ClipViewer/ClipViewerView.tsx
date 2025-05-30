import React from 'react';
import { ClipViewerViewProps } from './ClipViewerViewModel';
import ClipListView from '../ClipList/ClipListView';
import { useClipListViewModel } from '../ClipList/ClipListViewModel';
import './ClipViewer.css';

// Pure presentational component
const ClipViewerView: React.FC<ClipViewerViewProps & { onDoubleClick?: any }> = ({
    clips,
    isLoading,
    errorMessage,
    onClipClick,
    onAddClips,
    onDoubleClick
}) => {
    // Use ClipList view model to prepare props for the ClipList component
    const clipListProps = useClipListViewModel(clips, onClipClick, onDoubleClick);

    return (
        <div className="clip-viewer" data-testid="clip-viewer">
            <div className="clip-viewer-header">
                <h2>Video Clips</h2>
                <button
                    className="add-clips-button"
                    onClick={onAddClips}
                    disabled={isLoading}
                    data-testid="add-clips-button"
                >
                    Add Clips
                </button>
            </div>

            {errorMessage && (
                <div className="error-message" data-testid="error-message">
                    {errorMessage}
                </div>
            )}

            {isLoading ? (
                <div className="loading-indicator" data-testid="loading-indicator">
                    Loading clips...
                </div>
            ) : (
                <ClipListView {...clipListProps} />
            )}
        </div>
    );
};

export default ClipViewerView; 