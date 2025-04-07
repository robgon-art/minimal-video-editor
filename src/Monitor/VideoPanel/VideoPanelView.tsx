import React, { useRef, useEffect, useState } from 'react';
import { VideoPanelViewProps } from './VideoPanelViewModel';
import { fileSystem } from '../../services/storage/FileSystem';
import { OperationType } from '../../services/storage/StorageOperations';

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
const VideoPanelView: React.FC<VideoPanelViewProps> = ({
    clip,
    currentTime,
    timecode,
    testEnv
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    // Use test maxRetries if provided, otherwise default to 2
    const maxRetries = testEnv?.maxRetries !== undefined ? testEnv.maxRetries : 2;

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
                // Ensure the clip has a valid filePath
                if (!clip.filePath && clip.title) {
                    console.log('⚠️ No filePath provided, using title to construct path:', clip.title);
                    clip.filePath = `/media/${clip.title}.mp4`;
                }

                // Determine the correct path for the video
                const videoPath = clip.filePath || `/media/${clip.title}.mp4`;
                console.log('⚠️ Attempting to load video from path:', videoPath, 'Clip data:', clip);

                try {
                    // Try to read from IndexedDB storage
                    console.log('🔍 Reading from IndexedDB storage...');
                    const { data } = await fileSystem.executeOperation({
                        type: OperationType.READ,
                        path: videoPath
                    });

                    // Log successful data retrieval 
                    console.log(`✅ Successfully retrieved video data from IndexedDB: ${data.byteLength} bytes`);

                    if (data.byteLength === 0) {
                        throw new Error('Retrieved empty file data');
                    }

                    // Determine the correct MIME type based on file extension
                    const mimeType = getMimeType(videoPath);

                    // Create a blob URL from the file data with proper MIME type
                    const blob = new Blob([data], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    currentVideoUrl = url;
                    console.log(`🎬 Created blob URL for video: ${url} size: ${blob.size} mimeType: ${mimeType}`);
                    setVideoUrl(url);
                } catch (storageError) {
                    console.error('❌ Storage error:', storageError);

                    if (retryCount < maxRetries) {
                        console.log(`⚠️ Retry attempt ${retryCount + 1} of ${maxRetries}`);
                        setRetryCount(prev => prev + 1);
                        setTimeout(loadVideo, 500); // Retry after a short delay
                        return;
                    }

                    // In test mode with preventFallback, don't use the fallback URL
                    if (testEnv?.preventFallback) {
                        console.log('⚠️ Preventing fallback for testing');
                        throw new Error('[TEST_EXPECTED_ERROR] Failed to load video. Fallback prevented for testing.');
                    }

                    // Fallback to direct URL if storage fails
                    console.log('⚠️ Falling back to direct URL:', videoPath);
                    setVideoUrl(videoPath);
                }
            } catch (e) {
                console.error('❌ Error loading video:', e);
                setError('Failed to load video');
            } finally {
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
};

export default VideoPanelView; 