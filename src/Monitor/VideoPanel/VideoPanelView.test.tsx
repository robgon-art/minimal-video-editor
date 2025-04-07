import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VideoPanelView from './VideoPanelView';
import { Clip } from '../../Clip/ClipModel';
import { fileSystem } from '../../services/storage/FileSystem';
import { OperationType } from '../../services/storage/StorageOperations';

// Mock the file system module
jest.mock('../../services/storage/FileSystem', () => ({
    fileSystem: {
        executeOperation: jest.fn()
    }
}));

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
        filePath: 'test-file-path'
    };

    beforeEach(() => {
        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
        global.URL.revokeObjectURL = jest.fn();

        // Mock HTMLMediaElement.prototype.play
        HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());

        // Setup mock for fileSystem
        (fileSystem.executeOperation as jest.Mock).mockImplementation(async (operation) => {
            if (operation.type === OperationType.READ) {
                // Return mock video data
                return {
                    data: new ArrayBuffer(1024),
                    metadata: {
                        durationInSeconds: 60,
                        size: 1024,
                        lastModified: new Date()
                    }
                };
            }
            return null;
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
        expect(screen.getByText('Loading video...')).toBeInTheDocument();

        // Wait for video element to appear after loading
        await waitFor(() => {
            expect(screen.getByTestId('video-player')).toBeInTheDocument();
        });
    });

    it('uses the clip filepath as video source', async () => {
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

        // Verify URL.createObjectURL was called
        expect(URL.createObjectURL).toHaveBeenCalled();

        // Check that the src attribute contains the expected blob URL
        expect(videoElement.src).toContain('blob:');

        // Check poster attribute is present
        expect(videoElement).toHaveAttribute('poster');
    });

    it('cleans up URL objects when component unmounts', async () => {
        // Create a test URL that we can verify is cleaned up
        const testUrl = 'blob:test-cleanup-url';

        // Setup special implementation for this test
        global.URL.createObjectURL = jest.fn(() => testUrl);
        global.URL.revokeObjectURL = jest.fn();

        // Ensure the mock returns successfully so the component will set the videoUrl
        (fileSystem.executeOperation as jest.Mock).mockResolvedValueOnce({
            data: new ArrayBuffer(1024),
            metadata: { durationInSeconds: 60 }
        });

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

        // Check if URL.revokeObjectURL was called with our test URL
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(testUrl);
    });

    it('handles errors when loading video', async () => {
        // Setup mock to simulate error and prevent fallback
        (fileSystem.executeOperation as jest.Mock).mockRejectedValueOnce(new Error('[TEST_EXPECTED_ERROR] Test error'));

        render(
            <VideoPanelView
                clip={{
                    ...mockClip,
                    // Use a special path that our component can recognize to avoid fallback
                    filePath: 'TEST_ERROR_PATH'
                }}
                currentTime={0}
                timecode="00:00:00:00"
                testEnv={{
                    maxRetries: 0,
                    preventFallback: true // Add flag to prevent fallback to direct URL
                }}
            />
        );

        // Initially shows loading
        expect(screen.getByText('Loading video...')).toBeInTheDocument();

        // Wait for error state
        await waitFor(() => {
            const errorElement = screen.queryByText(/Failed to load video/i);
            expect(errorElement).not.toBeNull();
            expect(errorElement).toBeInTheDocument();
        }, { timeout: 3000 });
    });
}); 