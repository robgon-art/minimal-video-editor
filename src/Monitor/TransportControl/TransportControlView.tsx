import React from 'react';
import { TransportControlViewProps } from './TransportControlViewModel';

// Pure presentational component
const TransportControlView: React.FC<TransportControlViewProps> = ({
    isPlaying,
    onPlayPauseClick,
    onStepForwardClick,
    onStepBackwardClick
}) => {
    return (
        <div className="transport-control" data-testid="transport-control">
            <button
                className="step-backward-button"
                onClick={onStepBackwardClick}
                data-testid="step-backward-button"
                aria-label="Step backward"
                title="Step backward"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 4v8h2V4H1zm2 4l8 4V0L3 4z" />
                </svg>
            </button>

            <button
                className="play-pause-button"
                onClick={onPlayPauseClick}
                data-testid="play-pause-button"
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2.5 2h3v12h-3V2zm8 0h3v12h-3V2z" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 2l8 6-8 6V2z" />
                    </svg>
                )}
            </button>

            <button
                className="step-forward-button"
                onClick={onStepForwardClick}
                data-testid="step-forward-button"
                aria-label="Step forward"
                title="Step forward"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13 4v8h2V4h-2zm-2 4L3 0v16l8-4z" />
                </svg>
            </button>
        </div>
    );
};

export default TransportControlView; 