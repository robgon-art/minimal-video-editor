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
                <img src="/step_back.png" alt="Step backward" width="32" height="32" />
            </button>

            <button
                className="play-pause-button"
                onClick={onPlayPauseClick}
                data-testid="play-pause-button"
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <img src="/pause.png" alt="Pause" width="32" height="32" />
                ) : (
                    <img src="/play.png" alt="Play" width="32" height="32" />
                )}
            </button>

            <button
                className="step-forward-button"
                onClick={onStepForwardClick}
                data-testid="step-forward-button"
                aria-label="Step forward"
                title="Step forward"
            >
                <img src="/step_forward.png" alt="Step forward" width="32" height="32" />
            </button>
        </div>
    );
};

export default TransportControlView; 