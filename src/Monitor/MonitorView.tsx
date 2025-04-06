import React from 'react';
import { MonitorViewProps } from './MonitorViewModel';
import VideoPanelView from './VideoPanel/VideoPanelView';
import TimeRulerView from './TimeRuler/TimeRulerView';
import TransportControlView from './TransportControl/TransportControlView';
import './Monitor.css';

// Pure presentational component
const MonitorView: React.FC<MonitorViewProps> = ({
    title,
    currentClip,
    isPlaying,
    currentTime,
    duration,
    videoPanelProps,
    timeRulerProps,
    transportControlProps
}) => {
    return (
        <div className="monitor" data-testid="monitor">
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