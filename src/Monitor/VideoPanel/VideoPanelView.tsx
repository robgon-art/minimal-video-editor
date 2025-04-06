import React from 'react';
import { VideoPanelViewProps } from './VideoPanelViewModel';

// Pure presentational component
const VideoPanelView: React.FC<VideoPanelViewProps> = ({
    clip,
    timecode
}) => {
    return (
        <div className="video-panel" data-testid="video-panel">
            <div className="video-info">
                <div className="video-title" data-testid="video-title">
                    {clip ? clip.title : 'No clip selected'}
                </div>
                <div className="video-timecode" data-testid="video-timecode">
                    {timecode}
                </div>
            </div>
            <div className="video-display" data-testid="video-display">
                {clip ? (
                    <img
                        src={clip.thumbnailUrl}
                        alt={clip.title}
                        className="video-thumbnail"
                        data-testid="video-thumbnail"
                    />
                ) : (
                    <div className="no-video-placeholder" data-testid="no-video-placeholder">
                        No video to display
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPanelView; 