import React from 'react';
import { MonitorViewProps } from './MonitorViewModel';
import VideoPanelView from './VideoPanel/VideoPanelView';
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
    onDropClip
}) => {
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
            data-testid="monitor"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="monitor-header">
                <h3>{title}</h3>
            </div>
            <div className="monitor-content">
                <VideoPanelView {...videoPanelProps} />
                <TimeRulerView {...timeRulerProps} />
                <TransportControlView {...transportControlProps} />
            </div>
        </div>
    );
};

export default MonitorView; 