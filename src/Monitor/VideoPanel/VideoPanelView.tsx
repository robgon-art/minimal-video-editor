import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { VideoPanelViewProps } from './VideoPanelViewModel';

// Define the ref interface
export interface VideoPanelRef {
    play: () => void;
    pause: () => void;
    stepForward: (frames?: number) => void;
    stepBackward: (frames?: number) => void;
    getCurrentTime: () => number;
}

// Helper to get MIME type from file extension
const getMimeType = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'mp4':
            return 'video/mp4';
        case 'webm':
            return 'video/webm';
        case 'mov':
            return 'video/quicktime';
        case 'avi':
            return 'video/x-msvideo';
        case 'mkv':
            return 'video/x-matroska';
        default:
            return 'video/mp4'; // Default fallback
    }
};

// Pure presentational component
const VideoPanelView = forwardRef<VideoPanelRef, VideoPanelViewProps>(({
    clip,
    currentTime,
    timecode,
    testEnv
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    // Use test maxRetries if provided, otherwise default to 2
    const maxRetries = testEnv?.maxRetries !== undefined ? testEnv.maxRetries : 2;

    // Expose control methods to parent components
    useImperativeHandle(ref, () => ({
        play: () => {
            if (videoRef.current) {
                console.log('▶️ Play video');
                videoRef.current.play();
            }
        },
        pause: () => {
            if (videoRef.current) {
                console.log('⏸️ Pause video');
                videoRef.current.pause();
            }
        },
        stepForward: (frames = 1) => {
            if (videoRef.current) {
                // Default to 24fps if not specified in the clip
                const fps = clip?.fps || 24;
                // Calculate time for a single frame
                const frameDuration = 1 / fps;
                // Move forward by the specified number of frames
                const secondsToAdvance = frameDuration * frames;

                const newTime = Math.min(
                    videoRef.current.currentTime + secondsToAdvance,
                    videoRef.current.duration || 0
                );
                console.log(`⏩ Step forward ${frames} frame(s) (${secondsToAdvance.toFixed(3)}s) from ${videoRef.current.currentTime.toFixed(3)} to ${newTime.toFixed(3)}`);
                videoRef.current.currentTime = newTime;
            }
        },
        stepBackward: (frames = 1) => {
            if (videoRef.current) {
                // Default to 24fps if not specified in the clip
                const fps = clip?.fps || 24;
                // Calculate time for a single frame
                const frameDuration = 1 / fps;
                // Move backward by the specified number of frames
                const secondsToRetreat = frameDuration * frames;

                const newTime = Math.max(
                    videoRef.current.currentTime - secondsToRetreat,
                    0
                );
                console.log(`⏪ Step backward ${frames} frame(s) (${secondsToRetreat.toFixed(3)}s) from ${videoRef.current.currentTime.toFixed(3)} to ${newTime.toFixed(3)}`);
                videoRef.current.currentTime = newTime;
            }
        },
        getCurrentTime: () => {
            return videoRef.current?.currentTime || 0;
        }
    }), [clip]);

    // Log when component receives a clip prop
    useEffect(() => {
        console.log('🎬 VideoPanelView received clip prop:', clip ? {
            id: clip.id,
            title: clip.title,
            filePath: clip.filePath
        } : 'null');
    }, [clip]);

    // For testing: force error state if flag is set
    useEffect(() => {
        if (testEnv?.forceErrorState) {
            setError('Failed to load video. Using thumbnail instead.');
        }
    }, [testEnv?.forceErrorState]);

    // Load video when clip changes and clean up on unmount
    useEffect(() => {
        // Clean up previous URL if it exists
        if (videoUrl) {
            console.log('🧹 Cleaning up previous video URL:', videoUrl);
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(undefined);
        }

        setError(null);
        setRetryCount(0);

        if (!clip) {
            console.log('⚠️ No clip provided to VideoPanel, skipping video load');
            return;
        }

        console.log('🔄 Starting video load process for clip:', clip.id, clip.title);
        console.log('🔄 Clip data for loading:', JSON.stringify({
            id: clip.id,
            title: clip.title,
            filePath: clip.filePath || 'not set'
        }, null, 2));

        setIsLoading(true);

        // Store current URL for cleanup in finally block
        let currentVideoUrl: string | undefined = undefined;

        const loadVideo = async () => {
            try {
                // Always use the mediaUrl from the clip if available (from REST service)
                if (clip.mediaUrl) {
                    console.log('🌐 Using REST mediaUrl:', clip.mediaUrl);
                    setVideoUrl(clip.mediaUrl);
                    setIsLoading(false);
                    return;
                }

                // Fallback to direct URL if no mediaUrl is available
                console.log('⚠️ Falling back to direct path:', clip.filePath);
                setVideoUrl(clip.filePath);
                setIsLoading(false);
            } catch (e) {
                console.error('❌ Error loading video:', e);
                setError('Failed to load video');
                setIsLoading(false);
            }
        };

        loadVideo();

        // Clean up on unmount or when clip changes
        return () => {
            if (currentVideoUrl) {
                console.log('🧹 Cleaning up video URL on unmount:', currentVideoUrl);
                URL.revokeObjectURL(currentVideoUrl);
            }
            if (videoUrl) {
                console.log('🧹 Cleaning up state video URL on unmount:', videoUrl);
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [clip, retryCount, maxRetries, testEnv]);

    // Sync video's current time with the monitored currentTime
    useEffect(() => {
        if (videoRef.current) {
            // Always seek precisely when at the beginning to ensure first frame is shown
            if (currentTime === 0) {
                console.log('🎞️ Seeking video to beginning (currentTime = 0)');
                videoRef.current.currentTime = 0;
            }
            // For other times, only seek if the difference is significant
            else if (Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
                console.log(`🎞️ Seeking video from ${videoRef.current.currentTime} to ${currentTime}`);
                videoRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime]);

    // Handle video loading error
    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        console.error("❌ Video loading error:", e);
        console.error("❌ Video element error code:", videoRef.current?.error?.code);
        console.error("❌ Video element error message:", videoRef.current?.error?.message);

        // Try to recover by using the thumbnail
        setError('Failed to load video. Using thumbnail instead.');
    };

    // Render video element or fallback based on loading/error state
    const renderVideoContent = () => {
        if (!clip) {
            return (
                <div className="no-video-placeholder" data-testid="no-video-placeholder">
                    <div className="no-video-message">
                        <div>No clip loaded</div>
                        <div className="no-video-hint">Drag and drop a clip to load it</div>
                    </div>
                </div>
            );
        }

        if (isLoading) {
            return <div className="loading-indicator">Loading video...</div>;
        }

        if (error) {
            // Get the best available thumbnail for error state too
            const bestThumbnail = clip.loadedThumbnailUrl || clip.thumbnailUrl;

            return (
                <div className="video-fallback">
                    <img
                        src={bestThumbnail}
                        alt={clip.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <div className="video-error-overlay">{error}</div>
                </div>
            );
        }

        // Get the best available thumbnail
        const bestThumbnail = clip.loadedThumbnailUrl || clip.thumbnailUrl;

        return (
            <video
                ref={videoRef}
                className="video-player"
                data-testid="video-player"
                src={videoUrl}
                poster={bestThumbnail}
                controls
                preload="auto"
                autoPlay={false}
                style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000'
                }}
                onError={handleVideoError}
                onLoadStart={() => console.log('🎬 Video load started for:', videoUrl)}
                onLoadedMetadata={() => console.log('🎬 Video metadata loaded:', videoRef.current?.duration, 'seconds')}
                onLoadedData={(e) => {
                    console.log("✅ Video loaded successfully:", videoUrl);
                    console.log("✅ Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);

                    // Seek to the first frame immediately
                    const videoElement = e.currentTarget;
                    console.log("✅ Seeking to first frame...");
                    videoElement.currentTime = 0;

                    // After seeking to first frame, capture it as a high-res thumbnail
                    videoElement.addEventListener('seeked', function onSeeked() {
                        // Only run this once
                        videoElement.removeEventListener('seeked', onSeeked);

                        try {
                            // Create a high-resolution canvas to capture the frame
                            const canvas = document.createElement('canvas');
                            const width = Math.max(640, videoElement.videoWidth);
                            const height = Math.max(360, videoElement.videoHeight);
                            canvas.width = width;
                            canvas.height = height;

                            // Draw the current frame (which is now the first frame)
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(videoElement, 0, 0, width, height);

                                // Convert to a high-quality data URL
                                const firstFrameUrl = canvas.toDataURL('image/jpeg', 0.95);

                                // Update the poster with this high-res first frame
                                videoElement.poster = firstFrameUrl;

                                console.log("✅ Captured first frame as high-res thumbnail");
                            }
                        } catch (error) {
                            console.warn("⚠️ Error capturing first frame:", error);
                        }
                    });
                }}
            >
                Your browser does not support the video tag.
            </video>
        );
    };

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
                {renderVideoContent()}
            </div>
        </div>
    );
});

export default VideoPanelView; 