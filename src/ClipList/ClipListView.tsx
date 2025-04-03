import React from 'react';
import { ClipListViewProps } from './ClipListViewModel';
import ClipView from '../Clip/ClipView';
import { useClipViewModel } from '../Clip/ClipViewModel';
import { useClipsWithThumbnails } from './ClipListViewModel';

// Separate component for each clip item
const ClipListItem: React.FC<{ clip: any; onClipClick: (clip: any) => void }> = ({ clip, onClipClick }) => {
    // Use the loaded thumbnail if available
    const clipWithRealThumbnail = {
        ...clip,
        thumbnailUrl: clip.loadedThumbnailUrl || clip.thumbnailUrl
    };
    
    const clipProps = useClipViewModel(clipWithRealThumbnail, onClipClick);
    return <ClipView key={clip.id} {...clipProps} />;
};

// Pure presentational component for the clip list
const ClipListView: React.FC<ClipListViewProps> = ({ clips, onClipClick }) => {
    // Use our hook to get clips with real thumbnails
    const clipsWithThumbnails = useClipsWithThumbnails(clips);
    
    return (
        <div className="clip-list" data-testid="clip-list">
            {clipsWithThumbnails.map(clip => (
                <ClipListItem
                    key={clip.id}
                    clip={clip}
                    onClipClick={onClipClick}
                />
            ))}
        </div>
    );
};

export default ClipListView; 