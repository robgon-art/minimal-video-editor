import React from 'react';
import { ClipListViewProps } from './ClipListViewModel';
import ClipView from '../Clip/ClipView';
import { useClipViewModel } from '../Clip/ClipViewModel';

// Separate component for each clip item
const ClipListItem: React.FC<{ clip: any; onClipClick: (clip: any) => void }> = ({ clip, onClipClick }) => {
    const clipProps = useClipViewModel(clip, onClipClick);
    return <ClipView key={clip.id} {...clipProps} />;
};

// Pure presentational component for the clip list
const ClipListView: React.FC<ClipListViewProps> = ({ clips, onClipClick }) => {
    return (
        <div className="clip-list" data-testid="clip-list">
            {clips.map(clip => (
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