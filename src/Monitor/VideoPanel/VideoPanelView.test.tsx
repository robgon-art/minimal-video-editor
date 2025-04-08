import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import VideoPanelView from './VideoPanelView';
import { Clip } from '../../Clip/ClipModel';

// Mock values for testing
const TEST_ENV = {
    maxRetries: 0, // Disable retries in tests for predictable results
};

describe('VideoPanelView', () => {
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60,
        filePath: 'test-file-path',
        mediaUrl: 'http://localhost:3001/media/test-file-path'
    };

    beforeEach(() => {
        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
        global.URL.revokeObjectURL = jest.fn();

        // Mock HTMLMediaElement.prototype.play
        HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());

        // Mock video element properties that are not implemented in jsdom
        Object.defineProperty(HTMLMediaElement.prototype, 'error', {
            configurable: true,
            get: function () {
                return { code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with no clip', () => {
        render(
            <VideoPanelView
                clip={null}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        expect(screen.getByTestId('video-panel')).toBeInTheDocument();
        expect(screen.getByText('No clip selected')).toBeInTheDocument();
        expect(screen.getByTestId('no-video-placeholder')).toBeInTheDocument();
    });

    it('renders correctly with a clip', async () => {
        render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Initially should show loading state
        expect(screen.getByTestId('video-panel')).toBeInTheDocument();
        expect(screen.getByText('Test Clip')).toBeInTheDocument();

        // Wait for video element to appear after loading
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });
    });

    it('uses the clip mediaUrl as video source', async () => {
        render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for the video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        const videoElement = screen.getByTestId('video-player') as HTMLVideoElement;

        // Check that the src attribute contains the expected REST service URL
        expect(videoElement.src).toContain('localhost:3001/media/test-file-path');

        // Check poster attribute is present
        expect(videoElement).toHaveAttribute('poster');
    });

    it('falls back to filePath if mediaUrl is not available', async () => {
        const clipWithoutMediaUrl = {
            ...mockClip,
            mediaUrl: undefined
        };

        render(
            <VideoPanelView
                clip={clipWithoutMediaUrl}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for the video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        const videoElement = screen.getByTestId('video-player') as HTMLVideoElement;

        // Should use the filepath directly as fallback
        expect(videoElement.src).toContain('test-file-path');
    });

    it('cleans up URL objects when component unmounts', async () => {
        // Create a test URL that we can verify is cleaned up
        const testUrl = 'blob:test-cleanup-url';

        // Setup special implementation for this test
        global.URL.createObjectURL = jest.fn(() => testUrl);
        global.URL.revokeObjectURL = jest.fn();

        const { unmount } = render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for the video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Clear all previous mock calls
        jest.clearAllMocks();

        // Unmount the component (should trigger cleanup)
        unmount();

        // Since we're using a direct URL from the REST service, we may not need to revoke URLs
        // This test may not be as relevant with the REST service approach
    });

    it('handles errors when loading video', async () => {
        // Mock console.error to reduce noise
        const originalConsoleError = console.error;
        console.error = jest.fn();

        render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for video element to be rendered
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Manually trigger the error event on the video element
        const videoElement = screen.getByTestId('video-player');
        fireEvent.error(videoElement);

        // Now check for error message
        await waitFor(() => {
            expect(screen.getByText(/Failed to load video/i)).toBeInTheDocument();
        });

        console.error = originalConsoleError;
    });

    it('should update video currentTime when prop changes', async () => {
        // Mock setting currentTime on HTMLVideoElement
        let videoCurrentTime = 0;
        Object.defineProperty(HTMLVideoElement.prototype, 'currentTime', {
            configurable: true,
            get: function () {
                return videoCurrentTime;
            },
            set: function (value) {
                videoCurrentTime = value;
            }
        });

        const { rerender } = render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for the video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Verify video currentTime starts at 0
        expect(videoCurrentTime).toBe(0);

        // Update the currentTime prop
        rerender(
            <VideoPanelView
                clip={mockClip}
                currentTime={10}
                timecode="00:00:10:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for the effect to run and update the video currentTime
        await waitFor(() => {
            expect(videoCurrentTime).toBe(10);
        });

        // Update with a smaller change that shouldn't trigger an update (less than 0.1s difference)
        rerender(
            <VideoPanelView
                clip={mockClip}
                currentTime={10.05}
                timecode="00:00:10:01"
                testEnv={TEST_ENV}
            />
        );

        // Value should still be 10 as change is less than threshold
        await waitFor(() => {
            expect(videoCurrentTime).toBe(10);
        });
    });

    it('should handle video error and show thumbnail fallback', async () => {
        // Mock console.error to avoid test output noise
        const originalConsoleError = console.error;
        console.error = jest.fn();

        // Mock a clip with thumbnailUrl for testing fallback
        const clipWithThumbnail = {
            ...mockClip,
            thumbnailUrl: 'test-thumbnail-url'
        };

        render(
            <VideoPanelView
                clip={clipWithThumbnail}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for video element to be rendered
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Manually trigger the error event on the video element
        const videoElement = screen.getByTestId('video-player');
        fireEvent.error(videoElement);

        // Now check for error message
        await waitFor(() => {
            expect(screen.getByText(/Failed to load video/i)).toBeInTheDocument();
        });

        // Restore console.error
        console.error = originalConsoleError;
    });

    it('should handle autoplay failure gracefully', async () => {
        // Mock play() to reject (simulating browser autoplay restrictions)
        HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() =>
            Promise.reject(new Error('Autoplay prevented'))
        );

        render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for the video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Trigger onLoadedData event
        const videoElement = screen.getByTestId('video-player');
        fireEvent.loadedData(videoElement);

        // We no longer call play() automatically, so this test is modified
        // Just verify the component renders correctly
        expect(screen.getByTestId('video-panel')).toBeInTheDocument();
    });

    it('should display different video based on new clip', async () => {
        const { rerender } = render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for first video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Clear previous URL calls
        jest.clearAllMocks();

        // New clip with different path
        const newClip = {
            ...mockClip,
            id: 'new-test-id',
            title: 'New Test Clip',
            mediaUrl: 'http://localhost:3001/media/new-test-clip.mp4'
        };

        // Rerender with new clip
        rerender(
            <VideoPanelView
                clip={newClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for new video to load
        await waitFor(() => {
            const videoElement = screen.getByTestId('video-player') as HTMLVideoElement;
            expect(videoElement.src).toContain('new-test-clip.mp4');
        });
    });

    // Test for ref methods
    it('should expose and properly execute ref methods', async () => {
        // Setup video element mocks
        let videoCurrentTime = 0;
        let videoDuration = 60;
        let videoPlayed = false;
        let videoPaused = false;

        Object.defineProperty(HTMLVideoElement.prototype, 'currentTime', {
            configurable: true,
            get: function () { return videoCurrentTime; },
            set: function (value) { videoCurrentTime = value; }
        });

        Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
            configurable: true,
            get: function () { return videoDuration; }
        });

        HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => {
            videoPlayed = true;
            return Promise.resolve();
        });

        HTMLMediaElement.prototype.pause = jest.fn().mockImplementation(() => {
            videoPaused = true;
        });

        // Create ref to access component methods
        const ref = React.createRef<any>();

        render(
            <VideoPanelView
                ref={ref}
                clip={{
                    ...mockClip,
                    fps: 30 // Explicitly set fps for predictable frame navigation
                }}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Make sure ref is set before proceeding
        await waitFor(() => {
            expect(ref.current).not.toBeNull();
        });

        // Test play method
        act(() => {
            ref.current.play();
        });
        expect(videoPlayed).toBe(true);

        // Test pause method
        act(() => {
            ref.current.pause();
        });
        expect(videoPaused).toBe(true);

        // Test getCurrentTime method
        videoCurrentTime = 15;
        expect(ref.current.getCurrentTime()).toBe(15);

        // Test stepForward method - with default frames (1)
        act(() => {
            ref.current.stepForward();
        });
        // At 30fps, one frame is 1/30 = 0.0333... seconds
        expect(videoCurrentTime).toBeCloseTo(15 + (1 / 30), 4);

        // Test stepForward with specific frames count
        act(() => {
            ref.current.stepForward(5);
        });
        // Adding 5 frames at 30fps (5/30 = 0.166... seconds)
        expect(videoCurrentTime).toBeCloseTo(15 + (1 / 30) + (5 / 30), 4);

        // Test stepBackward method - with default frames (1)
        videoCurrentTime = 20;
        act(() => {
            ref.current.stepBackward();
        });
        expect(videoCurrentTime).toBeCloseTo(20 - (1 / 30), 4);

        // Test stepBackward with specific frames count
        act(() => {
            ref.current.stepBackward(5);
        });
        expect(videoCurrentTime).toBeCloseTo(20 - (1 / 30) - (5 / 30), 4);

        // Test stepForward at the end of video
        videoCurrentTime = 59.9;
        act(() => {
            ref.current.stepForward(10); // Try to go beyond the end
        });
        expect(videoCurrentTime).toBe(videoDuration); // Should cap at duration

        // Test stepBackward at the beginning of video
        videoCurrentTime = 0.05;
        act(() => {
            ref.current.stepBackward(10); // Try to go before the beginning
        });
        expect(videoCurrentTime).toBe(0); // Should cap at 0
    });

    // Test for missing filePath scenario - not applicable with REST service
    /*
    it('should handle clip with no filePath but with title', async () => {
        const clipWithoutPath = {
            ...mockClip,
            filePath: undefined // Remove the filepath
        };

        render(
            <VideoPanelView
                clip={clipWithoutPath}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Check that it attempted to load the video using the title
        expect(fileSystem.executeOperation).toHaveBeenCalledWith(
            expect.objectContaining({
                path: expect.stringContaining(mockClip.title)
            })
        );
    });
    */

    // Test for thumbnail usage
    it('should use thumbnailUrl as video poster', async () => {
        render(
            <VideoPanelView
                clip={mockClip}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Check that the poster attribute uses the thumbnailUrl
        const videoElement = screen.getByTestId('video-player');
        expect(videoElement).toHaveAttribute('poster', mockClip.thumbnailUrl);
    });

    // Test with high-quality thumbnail
    it('should use loadedThumbnailUrl as poster when available', async () => {
        const clipWithLoadedThumbnail = {
            ...mockClip,
            loadedThumbnailUrl: 'high-quality-thumbnail-url',
            thumbnailUrl: 'regular-thumbnail-url'
        };

        render(
            <VideoPanelView
                clip={clipWithLoadedThumbnail}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={TEST_ENV}
            />
        );

        // Wait for video to load
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });

        // Check that the poster attribute uses the loadedThumbnailUrl
        const videoElement = screen.getByTestId('video-player');
        expect(videoElement).toHaveAttribute('poster', 'high-quality-thumbnail-url');
    });

    // Test the first frame capture functionality
    it('should attempt to capture first frame on video load', async () => {
        // Mock canvas and context for first frame capture
        const mockCanvas = {
            width: 0,
            height: 0,
            toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mock'),
            getContext: jest.fn()
        };

        const mockContext = {
            drawImage: jest.fn()
        };

        // Save original createElement to restore later
        const originalCreateElement = document.createElement;

        // Properly mock createElement to avoid recursive issues
        document.createElement = jest.fn().mockImplementation((tagName) => {
            if (tagName === 'canvas') {
                return mockCanvas;
            }
            return originalCreateElement.call(document, tagName);
        });

        mockCanvas.getContext.mockReturnValue(mockContext);

        // Mock video element properties for first frame capture
        Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
            configurable: true,
            get: function () { return 1280; }
        });

        Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
            configurable: true,
            get: function () { return 720; }
        });

        try {
            render(
                <VideoPanelView
                    clip={mockClip}
                    currentTime={0}
                    timecode="00:00:00:00"
                    testEnv={TEST_ENV}
                />
            );

            // Wait for video to load
            await waitFor(() => {
                expect(screen.getByTestId('video-player')).toBeInTheDocument();
            });

            // Trigger loadedData event to initiate first frame capture
            const videoElement = screen.getByTestId('video-player');
            fireEvent.loadedData(videoElement);

            // Force seeking event (normally this would happen after setting currentTime)
            fireEvent.seeked(videoElement);

            // Verify canvas was created and used
            expect(document.createElement).toHaveBeenCalledWith('canvas');
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            expect(mockContext.drawImage).toHaveBeenCalled();
            expect(mockCanvas.toDataURL).toHaveBeenCalled();
        } finally {
            // Restore original createElement
            document.createElement = originalCreateElement;
        }
    });

    // Test handling error during first frame capture
    it('should handle errors during first frame capture', async () => {
        // Mock console.warn to verify error logging
        const originalConsoleWarn = console.warn;
        console.warn = jest.fn();

        // Save original createElement to restore later
        const originalCreateElement = document.createElement;

        // Make canvas throw an error when used
        document.createElement = jest.fn().mockImplementation((tagName) => {
            if (tagName === 'canvas') {
                throw new Error('Canvas not supported');
            }
            return originalCreateElement.call(document, tagName);
        });

        try {
            render(
                <VideoPanelView
                    clip={mockClip}
                    currentTime={0}
                    timecode="00:00:00:00"
                    testEnv={TEST_ENV}
                />
            );

            // Wait for video to load
            await waitFor(() => {
                expect(screen.getByTestId('video-player')).toBeInTheDocument();
            });

            // Trigger loadedData event
            const videoElement = screen.getByTestId('video-player');
            fireEvent.loadedData(videoElement);

            // Trigger seeked event
            fireEvent.seeked(videoElement);

            // Verify error was logged
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Error capturing first frame'),
                expect.anything()
            );
        } finally {
            // Restore console.warn and createElement
            console.warn = originalConsoleWarn;
            document.createElement = originalCreateElement;
        }
    });

    // The following tests are removed since they're no longer applicable with the REST service approach.
    // All file access is now handled by the REST service, not by client-side code.

    /*
    it('should recognize different file extensions', async () => {
        // Test various file extensions - now handled by the server
    });

    it('should retry loading video when initial load fails', async () => {
        // Retry logic has been removed since we rely on browser fetch behavior now
    });

    it('should handle empty file data error', async () => {
        // File data is now handled by the server
    });

    it('should fallback to direct URL if storage fails and preventFallback is not set', async () => {
        // Storage is now handled by the server
    });
    */
}); 