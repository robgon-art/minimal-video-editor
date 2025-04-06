import React, { useRef, useEffect, useState } from 'react';
import { VideoPanelViewProps } from './VideoPanelViewModel';

// Pure presentational component
const VideoPanelView: React.FC<VideoPanelViewProps> = ({
    clip,
    currentTime,
    timecode
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);

    // Load video when clip changes and clean up on unmount
    useEffect(() => {
        // Clean up previous URL if it exists
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }

        // Create a new blob URL when a clip with filePath is available
        if (clip?.filePath) {
            // In a real implementation, we would read the file and create a blob
            // For now, we'll just use the filePath as the src directly
            setVideoUrl(clip.filePath);
        } else {
            setVideoUrl(undefined);
        }

        // Clean up on unmount
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [clip]);

    // Sync video's current time with the monitored currentTime
    useEffect(() => {
        if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime]);

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
                    <video
                        ref={videoRef}
                        className="video-player"
                        data-testid="video-player"
                        src={videoUrl}
                        poster={clip.thumbnailUrl}
                        controls
                    >
                        Your browser does not support the video tag.
                    </video>
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