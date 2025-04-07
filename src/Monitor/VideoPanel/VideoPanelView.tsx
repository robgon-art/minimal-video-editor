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

        if (!clip) return;

        console.log('Loading clip:', clip);
        setIsLoading(true);

        // Store current URL for cleanup in finally block
        let currentVideoUrl: string | undefined = undefined;

        const loadVideo = async () => {
            try {
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
        if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
            videoRef.current.currentTime = currentTime;
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
                    No video to display
                </div>
            );
        }

        if (isLoading) {
            return <div className="loading-indicator">Loading video...</div>;
        }

        if (error) {
            return (
                <div className="video-fallback">
                    <img
                        src={clip.thumbnailUrl}
                        alt={clip.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <div className="video-error-overlay">{error}</div>
                </div>
            );
        }

        return (
            <video
                ref={videoRef}
                className="video-player"
                data-testid="video-player"
                src={videoUrl}
                poster={clip.thumbnailUrl}
                controls
                autoPlay
                style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000'
                }}
                onError={handleVideoError}
                onLoadedData={(e) => {
                    console.log("✅ Video loaded successfully:", videoUrl);
                    console.log("✅ Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);

                    // Force play after load to ensure we see the video
                    const videoElement = e.currentTarget;
                    videoElement.play().catch(playError => {
                        console.warn("⚠️ Autoplay failed, may need user interaction:", playError);
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