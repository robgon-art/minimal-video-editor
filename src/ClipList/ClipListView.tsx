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

    // Make clip draggable
    const handleDragStart = (e: React.DragEvent) => {
        // Store the clip data as serialized JSON in the dataTransfer object
        e.dataTransfer.setData('application/json', JSON.stringify(clip));

        // Set a custom drag image
        if (clip.loadedThumbnailUrl || clip.thumbnailUrl) {
            const imgUrl = clip.loadedThumbnailUrl || clip.thumbnailUrl;

            // Create a properly sized visible drag image
            const img = new Image();
            img.src = imgUrl;

            // Create temporary container for proper sizing
            const dragContainer = document.createElement('div');
            dragContainer.style.position = 'fixed';
            dragContainer.style.top = '-1000px'; // Off-screen but rendered
            dragContainer.style.width = '100px';
            dragContainer.style.height = '56px';
            dragContainer.style.overflow = 'hidden';
            dragContainer.style.backgroundColor = '#000';

            // Style the image to fit properly inside container
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';

            // Add to DOM temporarily
            dragContainer.appendChild(img);
            document.body.appendChild(dragContainer);

            // Set as drag image - use the container rather than just the image
            if (img.complete) {
                e.dataTransfer.setDragImage(dragContainer, 50, 28);
                setTimeout(() => document.body.removeChild(dragContainer), 0);
            } else {
                img.onload = () => {
                    e.dataTransfer.setDragImage(dragContainer, 50, 28);
                    setTimeout(() => document.body.removeChild(dragContainer), 0);
                };
            }
        }
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="clip-list-item"
            data-testid={`clip-list-item-${clip.id}`}
        >
            <ClipView key={clip.id} {...clipProps} />
        </div>
    );
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