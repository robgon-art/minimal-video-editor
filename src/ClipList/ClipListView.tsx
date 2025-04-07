import React from 'react';
import { ClipListViewProps } from './ClipListViewModel';
import ClipView from '../Clip/ClipView';
import { useClipViewModel } from '../Clip/ClipViewModel';
import { useClipsWithThumbnails } from './ClipListViewModel';

// Separate component for each clip item
const ClipListItem: React.FC<{
    clip: any;
    onClipClick: (id: string) => void;
    onDoubleClick?: (clip: any) => void;
}> = ({ clip, onClipClick, onDoubleClick }) => {
    // Use the loaded thumbnail if available
    const clipWithRealThumbnail = {
        ...clip,
        thumbnailUrl: clip.loadedThumbnailUrl || clip.thumbnailUrl
    };

    // Pass the enhanced onClipClick handler that includes clip ID
    const enhancedOnClipClick = (clipId: string) => {
        console.log('🔔 REGULAR CLICK EVENT TRIGGERED');
        console.log('🔔 Clip clicked with ID:', clipId);
        console.log('🔔 Original clip ID:', clip.id);
        console.log('🔔 Calling onClipClick with ID:', clipId);
        // Make sure onClipClick is called with the ID
        onClipClick(clipId);
        console.log('🔔 onClipClick handler called');
    };

    // Handle double click to load clip into source monitor
    const handleDoubleClick = () => {
        console.log('📌 DOUBLE CLICK EVENT TRIGGERED');
        console.log('📌 Clip double-clicked with ID:', clip.id);
        console.log('📌 Clip details:', JSON.stringify(clip, null, 2));

        // Call the dedicated double-click handler if provided
        if (onDoubleClick) {
            console.log('📌 Calling onDoubleClick with clip');
            onDoubleClick(clip);
            console.log('📌 onDoubleClick handler called');
        }
    };

    const clipProps = useClipViewModel(clipWithRealThumbnail, enhancedOnClipClick);

    // Make clip draggable
    const handleDragStart = (e: React.DragEvent) => {
        // Fix thumbnail paths and ensure filePath is correctly set
        const videoPath = clip.filePath || `/media/${clip.title}.mp4`;
        const thumbnailPath = clip.thumbnailUrl.includes('/video_clip.png')
            ? `/media/thumbnails/${clip.title}.jpg`
            : clip.thumbnailUrl;

        // Make sure filePath is included in the clip data for video playback
        const clipWithFilePath = {
            ...clip,
            filePath: videoPath,
            thumbnailUrl: thumbnailPath,
            _dragSource: 'clipList' // Add source info for debugging
        };

        console.log('Dragging clip with data:', clipWithFilePath);

        // Store the enhanced clip data as serialized JSON
        e.dataTransfer.setData('application/json', JSON.stringify(clipWithFilePath));

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
            onDoubleClick={handleDoubleClick}
            className="clip-list-item"
            data-testid={`clip-list-item-${clip.id}`}
        >
            <ClipView key={clip.id} {...clipProps} />
        </div>
    );
};

// Pure presentational component for the clip list
const ClipListView: React.FC<ClipListViewProps & { onDoubleClick?: (clip: any) => void }> = ({
    clips,
    onClipClick,
    onDoubleClick
}) => {
    // Use our hook to get clips with real thumbnails
    const clipsWithThumbnails = useClipsWithThumbnails(clips);

    console.log('🔍 ClipListView rendered with', clipsWithThumbnails.length, 'clips');
    console.log('🔍 onClipClick handler provided:', !!onClipClick);
    console.log('🔍 onDoubleClick handler provided:', !!onDoubleClick);

    return (
        <div className="clip-list" data-testid="clip-list">
            {clipsWithThumbnails.map(clip => (
                <ClipListItem
                    key={clip.id}
                    clip={clip}
                    onClipClick={onClipClick}
                    onDoubleClick={onDoubleClick}
                />
            ))}
        </div>
    );
};

export default ClipListView; 