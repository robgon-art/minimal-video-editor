import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import VideoPanelView, { VideoPanelRef } from './VideoPanel/VideoPanelView';
import TransportControlView from './TransportControl/TransportControlView';
import { TransportControlViewProps } from './TransportControl/TransportControlViewModel';
import { MonitorViewProps } from './MonitorViewModel';
import MonitorView from './MonitorView';

// Sample clip data for testing
const mockClip = {
    id: 'test-clip-1',
    title: 'Test Clip',
    filePath: '/media/test-clip.mp4',
    thumbnailUrl: '/media/test-thumbnail.jpg',
    duration: 60
};

// Mock FileSystem to avoid loading errors
jest.mock('../services/storage/FileSystem', () => ({
    fileSystem: {
        executeOperation: jest.fn().mockResolvedValue({
            data: new ArrayBuffer(1024) // Mock video data
        })
    }
}));

describe('Video Controls Integration', () => {
    // Create a custom mock for the VideoPanelRef
    const createMockVideoRef = () => {
        // Create play/pause spy functions that we can track
        const playFn = jest.fn().mockImplementation(() => Promise.resolve());
        const pauseFn = jest.fn();

        // Mock current time that we can control
        let currentTime = 0;
        const fps = 24; // Default FPS for tests

        // Create mock ref object with controlled implementations
        const mockRef: VideoPanelRef = {
            play: playFn,
            pause: pauseFn,
            stepForward: jest.fn().mockImplementation((frames = 1) => {
                // Calculate frame duration and adjust time
                const frameDuration = 1 / fps;
                const secondsToAdvance = frameDuration * frames;
                currentTime += secondsToAdvance;
            }),
            stepBackward: jest.fn().mockImplementation((frames = 1) => {
                // Calculate frame duration and adjust time
                const frameDuration = 1 / fps;
                const secondsToRetreat = frameDuration * frames;
                currentTime = Math.max(0, currentTime - secondsToRetreat);
            }),
            getCurrentTime: jest.fn().mockImplementation(() => currentTime)
        };

        return {
            mockRef,
            playFn,
            pauseFn,
            setCurrentTime: (time: number) => { currentTime = time; }
        };
    };

    // Test direct interaction between TransportControl and VideoPanel
    test('TransportControl buttons should control video playback via refs', async () => {
        // Create our controlled mock implementation
        const { mockRef, playFn, pauseFn, setCurrentTime } = createMockVideoRef();

        // Initial state and handlers
        let isPlaying = false;
        const setIsPlaying = (value: boolean) => { isPlaying = value; };

        // Play/pause handlers that use our mock ref
        const handlePlay = jest.fn(() => {
            mockRef.play();
            setIsPlaying(true);
        });

        const handlePause = jest.fn(() => {
            mockRef.pause();
            setIsPlaying(false);
        });

        // Step handlers
        const handleStepForward = jest.fn(() => {
            mockRef.stepForward();
        });

        const handleStepBackward = jest.fn(() => {
            mockRef.stepBackward();
        });

        // Combined handler for play/pause
        const handlePlayPause = () => {
            if (isPlaying) {
                handlePause();
            } else {
                handlePlay();
            }
        };

        // Create transport control props
        const transportProps: TransportControlViewProps = {
            isPlaying,
            onPlayPauseClick: handlePlayPause,
            onStepForwardClick: handleStepForward,
            onStepBackwardClick: handleStepBackward
        };

        // Render only the transport controls since we're mocking the video panel
        render(<TransportControlView {...transportProps} />);

        // Get the buttons
        const playPauseButton = screen.getByTestId('play-pause-button');
        const stepForwardButton = screen.getByTestId('step-forward-button');
        const stepBackwardButton = screen.getByTestId('step-backward-button');

        // Initial state should be paused
        expect(isPlaying).toBe(false);

        // Click play
        await act(async () => {
            fireEvent.click(playPauseButton);
        });

        // Verify play was called on our mock
        expect(handlePlay).toHaveBeenCalledTimes(1);
        expect(playFn).toHaveBeenCalledTimes(1);

        // Update isPlaying for the next test
        transportProps.isPlaying = true;

        // Click pause
        await act(async () => {
            fireEvent.click(playPauseButton);
        });

        // Verify pause was called on our mock
        expect(handlePause).toHaveBeenCalledTimes(1);
        expect(pauseFn).toHaveBeenCalledTimes(1);

        // Set up current time for step tests
        setCurrentTime(5);

        // Test step forward
        await act(async () => {
            fireEvent.click(stepForwardButton);
        });

        expect(handleStepForward).toHaveBeenCalledTimes(1);
        // 5 + (1/24) = 5.0416666...
        const expectedTimeAfterStep = 5 + (1 / 24);
        expect(mockRef.getCurrentTime()).toBeCloseTo(expectedTimeAfterStep, 5); // Check with proper precision

        // Test step backward
        await act(async () => {
            fireEvent.click(stepBackwardButton);
        });

        expect(handleStepBackward).toHaveBeenCalledTimes(1);
        // After stepping forward and backward one frame each, we should be back where we started
        expect(mockRef.getCurrentTime()).toBeCloseTo(5, 5);
    });

    // Test the integration through the MonitorView component
    test('MonitorView should properly integrate transport controls with video panel', async () => {
        // Mock time update handler
        const handleTimeUpdate = jest.fn();

        // Create props for MonitorView
        const monitorProps: MonitorViewProps = {
            title: 'Test Monitor',
            currentClip: mockClip,
            isPlaying: false,
            currentTime: 0,
            duration: 60,
            videoPanelProps: {
                clip: mockClip,
                currentTime: 0,
                timecode: '00:00:00:00',
                testEnv: {
                    preventFallback: true,
                    maxRetries: 0
                }
            },
            timeRulerProps: {
                currentTime: 0,
                duration: 60,
                progress: 0,
                tickMarks: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60],
                onTimeUpdate: handleTimeUpdate,
                onProgressBarClick: jest.fn()
            },
            transportControlProps: {
                isPlaying: false,
                onPlayPauseClick: jest.fn(),
                onStepForwardClick: jest.fn(),
                onStepBackwardClick: jest.fn()
            }
        };

        // Render the component
        await act(async () => {
            render(<MonitorView {...monitorProps} />);
        });

        // Get the buttons
        const playPauseButton = screen.getByTestId('play-pause-button');
        const stepForwardButton = screen.getByTestId('step-forward-button');
        const stepBackwardButton = screen.getByTestId('step-backward-button');

        // Ensure elements are rendered
        expect(playPauseButton).toBeInTheDocument();
        expect(stepForwardButton).toBeInTheDocument();
        expect(stepBackwardButton).toBeInTheDocument();

        // Verify click handlers are called
        await act(async () => {
            fireEvent.click(playPauseButton);
        });
        expect(monitorProps.transportControlProps.onPlayPauseClick).toHaveBeenCalledTimes(1);

        await act(async () => {
            fireEvent.click(stepForwardButton);
        });
        expect(monitorProps.transportControlProps.onStepForwardClick).toHaveBeenCalledTimes(1);

        await act(async () => {
            fireEvent.click(stepBackwardButton);
        });
        expect(monitorProps.transportControlProps.onStepBackwardClick).toHaveBeenCalledTimes(1);
    });
}); 