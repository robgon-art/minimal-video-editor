import React from 'react';
import { TimeRulerViewProps } from './TimeRulerViewModel';
import { formatTimecode } from '../VideoPanel/VideoPanelViewModel';

// Pure presentational component
const TimeRulerView: React.FC<TimeRulerViewProps> = ({
    currentTime,
    duration,
    progress,
    tickMarks,
    onProgressBarClick
}) => {
    // Only show a subset of tick marks with labels to avoid overcrowding
    const shouldShowLabel = (index: number) => index % 2 === 0;

    return (
        <div className="time-ruler" data-testid="time-ruler">
            <div
                className="progress-bar-container"
                onClick={onProgressBarClick}
                data-testid="progress-bar-container"
            >
                <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                    data-testid="progress-bar"
                />
                <div
                    className="playhead"
                    style={{ left: `${progress}%` }}
                    data-testid="playhead"
                />

                {/* Tick marks integrated with progress bar */}
                {tickMarks.map((time, index) => (
                    <div
                        key={index}
                        className="tick-mark"
                        style={{
                            left: `${(time / duration) * 100}%`,
                            height: shouldShowLabel(index) ? '10px' : '5px',
                            top: '0px',
                            position: 'absolute'
                        }}
                    >
                        {shouldShowLabel(index) && (
                            <div
                                className="tick-label"
                                style={{
                                    fontSize: '9px',
                                    position: 'absolute',
                                    top: '12px',
                                    left: '0',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {formatTimecode(time).substring(3)} {/* Show MM:SS:FF without HH */}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="time-display" data-testid="time-display">
                <span className="current-time">{formatTimecode(currentTime)}</span>
                <span className="duration">{formatTimecode(duration)}</span>
            </div>
        </div>
    );
};

export default TimeRulerView; 