import React, { useRef } from 'react';
import { MonitorViewProps } from './MonitorViewModel';
import VideoPanelView, { VideoPanelRef } from './VideoPanel/VideoPanelView';
import TimeRulerView from './TimeRuler/TimeRulerView';
import TransportControlView from './TransportControl/TransportControlView';
import './Monitor.css';

// Enhanced props with drop handler
interface EnhancedMonitorViewProps extends MonitorViewProps {
    onDropClip?: (clip: any) => void;
}

// Pure presentational component
const MonitorView: React.FC<EnhancedMonitorViewProps> = ({
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
}) => {
    // Create video panel ref if one wasn't provided
    const internalVideoPanelRef = useRef<VideoPanelRef>(null);
    // Use provided ref or fallback to internal ref
    const videoRef = videoPanelRef || internalVideoPanelRef;

    // Handle dragover event to allow dropping
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    // Handle drop event for clips
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        try {
            // Get the clip data from the dataTransfer object
            const clipJson = e.dataTransfer.getData('application/json');
            if (clipJson) {
                const clip = JSON.parse(clipJson);
                console.log('Clip dropped into monitor:', clip);

                // Validate clip data
                if (!clip.id || !clip.title) {
                    console.error('Invalid clip data dropped:', clip);
                    return;
                }

                // Ensure filePath is correctly set
                if (!clip.filePath) {
                    console.warn('Clip dropped without filePath, deriving from title');
                    clip.filePath = `/media/${clip.title}.mp4`;
                }

                // Call the callback if provided
                if (onDropClip) {
                    onDropClip(clip);
                }
            }
        } catch (error) {
            console.error('Error processing dropped clip:', error);
        }
    };

    return (
        <div
            className="monitor"
            data-testid={`monitor-${title.toLowerCase()}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="monitor-header">
                <h3>{title}</h3>
                {!currentClip && (
                    <div className="monitor-empty-message">
                        Drag and drop a clip here to load it
                    </div>
                )}
            </div>
            <div className="monitor-content">
                <VideoPanelView ref={videoRef} {...videoPanelProps} />
                <TimeRulerView {...timeRulerProps} />
                <TransportControlView {...transportControlProps} />
            </div>
        </div>
    );
};

export default MonitorView; 