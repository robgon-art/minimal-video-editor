import { renderHook, act } from '@testing-library/react';
import { useEditorViewModel, createEditorViewProps } from './EditorViewModel';
import { Clip } from '../models/ClipModel';
import { VideoPanelViewProps } from '../Monitor/VideoPanel/VideoPanelViewModel';
import { TimeRulerViewProps } from '../Monitor/TimeRuler/TimeRulerViewModel';
import { TransportControlViewProps } from '../Monitor/TransportControl/TransportControlViewModel';
import React from 'react';

// Create actual mock implementations that return objects
const mockClipViewerImpl = {
    clips: [] as Clip[],
    isLoading: false,
    errorMessage: null,
    onClipClick: jest.fn(),
    onAddClips: jest.fn()
};

// Mock the hook modules
jest.mock('../ClipViewer/ClipViewerViewModel', () => ({
    useClipViewerViewModel: jest.fn()
}));

jest.mock('../Monitor/MonitorViewModel', () => ({
    useMonitorViewModel: jest.fn()
}));

// Import the mocked modules
import { useClipViewerViewModel } from '../ClipViewer/ClipViewerViewModel';
import { useMonitorViewModel } from '../Monitor/MonitorViewModel';

describe('EditorViewModel', () => {
    // Setup mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();

        // Set up the clip viewer mock to return our implementation
        (useClipViewerViewModel as jest.Mock).mockReturnValue(mockClipViewerImpl);

        // Set up monitor view model mock
        (useMonitorViewModel as jest.Mock).mockImplementation((
            title,
            currentClip,
            isPlaying,
            currentTime,
            duration,
            onTimeUpdate,
            onPlay,
            onPause,
            onStepForward,
            onStepBackward
        ) => ({
            title,
            currentClip,
            isPlaying,
            currentTime,
            duration,
            videoPanelProps: {
                clip: currentClip,
                currentTime,
                timecode: '00:00:00:00'
            },
            timeRulerProps: {
                currentTime,
                duration,
                progress: duration > 0 ? currentTime / duration : 0,
                tickMarks: [],
                onProgressBarClick: jest.fn(),
                onTimeUpdate: onTimeUpdate
            },
            transportControlProps: {
                isPlaying,
                onPlayPauseClick: isPlaying ? onPause : onPlay,
                onStepForwardClick: onStepForward,
                onStepBackwardClick: onStepBackward
            },
            onTimeUpdate
        }));
    });

    describe('createEditorViewProps', () => {
        it('should create view props correctly', () => {
            // Arrange
            const title = 'Test Editor';
            const mockClipViewerProps = {
                clips: [],
                isLoading: false,
                errorMessage: null,
                onClipClick: jest.fn(),
                onAddClips: jest.fn()
            };
            const mockSourceMonitorProps = {
                title: 'Source',
                currentClip: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                videoPanelProps: {
                    clip: null,
                    currentTime: 0,
                    timecode: '00:00:00:00'
                } as VideoPanelViewProps,
                timeRulerProps: {
                    currentTime: 0,
                    duration: 0,
                    progress: 0,
                    tickMarks: [],
                    onProgressBarClick: jest.fn(),
                    onTimeUpdate: jest.fn()
                } as TimeRulerViewProps,
                transportControlProps: {
                    isPlaying: false,
                    onPlayPauseClick: jest.fn(),
                    onStepForwardClick: jest.fn(),
                    onStepBackwardClick: jest.fn()
                } as TransportControlViewProps,
                onTimeUpdate: jest.fn()
            };
            const mockProgramMonitorProps = {
                title: 'Program',
                currentClip: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                videoPanelProps: {
                    clip: null,
                    currentTime: 0,
                    timecode: '00:00:00:00'
                } as VideoPanelViewProps,
                timeRulerProps: {
                    currentTime: 0,
                    duration: 0,
                    progress: 0,
                    tickMarks: [],
                    onProgressBarClick: jest.fn(),
                    onTimeUpdate: jest.fn()
                } as TimeRulerViewProps,
                transportControlProps: {
                    isPlaying: false,
                    onPlayPauseClick: jest.fn(),
                    onStepForwardClick: jest.fn(),
                    onStepBackwardClick: jest.fn()
                } as TransportControlViewProps,
                onTimeUpdate: jest.fn()
            };

            // Act
            const result = createEditorViewProps(
                title,
                mockClipViewerProps,
                mockSourceMonitorProps,
                mockProgramMonitorProps
            );

            // Assert
            expect(result).toEqual({
                title,
                clipViewerProps: mockClipViewerProps,
                sourceMonitorProps: mockSourceMonitorProps,
                programMonitorProps: mockProgramMonitorProps
            });
        });
    });

    describe('useEditorViewModel', () => {
        it('should initialize with default state', () => {
            // Act
            const { result } = renderHook(() => useEditorViewModel());

            // Assert
            expect(result.current).toEqual({
                title: 'Video Editor App',
                clipViewerProps: mockClipViewerImpl,
                sourceMonitorProps: expect.any(Object),
                programMonitorProps: expect.any(Object)
            });
        });

        it('should update selected clip when clips change', () => {
            // Arrange
            const mockClip: Clip = {
                id: 'test-id',
                title: 'Test Clip',
                thumbnailUrl: 'test-url',
                duration: 60,
                selected: true
            };

            // Set up mock clips
            mockClipViewerImpl.clips = [mockClip];

            // Act
            const { result } = renderHook(() => useEditorViewModel());

            // Assert
            expect(result.current.sourceMonitorProps.currentClip).toBe(mockClip);
        });

        it('should reset source time when selected clip changes', () => {
            // Arrange
            const mockClip1: Clip = {
                id: 'clip-1',
                title: 'Clip 1',
                thumbnailUrl: 'url-1',
                duration: 30,
                selected: true
            };

            // Set up initial clip
            mockClipViewerImpl.clips = [mockClip1];

            // Act
            const { result, rerender } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.sourceMonitorProps.currentTime).toBe(0);
            expect(result.current.sourceMonitorProps.isPlaying).toBe(false);

            // Simulate time update
            act(() => {
                result.current.sourceMonitorProps.onTimeUpdate(15);
            });

            // Verify time was updated
            expect(result.current.sourceMonitorProps.currentTime).toBe(15);

            // Change the clip
            const mockClip2: Clip = {
                id: 'clip-2',
                title: 'Clip 2',
                thumbnailUrl: 'url-2',
                duration: 60,
                selected: true
            };
            mockClipViewerImpl.clips = [mockClip2];

            // Rerender to trigger clip change
            rerender();

            // Assert time was reset
            expect(result.current.sourceMonitorProps.currentTime).toBe(0);
            expect(result.current.sourceMonitorProps.isPlaying).toBe(false);
        });

        it('should handle source monitor time updates', () => {
            // Act
            const { result } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.sourceMonitorProps.currentTime).toBe(0);

            // Update time
            act(() => {
                result.current.sourceMonitorProps.onTimeUpdate(30);
            });

            // Assert
            expect(result.current.sourceMonitorProps.currentTime).toBe(30);
        });

        it('should handle program monitor time updates', () => {
            // Act
            const { result } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.programMonitorProps.currentTime).toBe(0);

            // Update time
            act(() => {
                result.current.programMonitorProps.onTimeUpdate(45);
            });

            // Assert
            expect(result.current.programMonitorProps.currentTime).toBe(45);
        });

        it('should handle source monitor play/pause', () => {
            // Act
            const { result, rerender } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.sourceMonitorProps.isPlaying).toBe(false);

            // Capture the play function
            const playFn = result.current.sourceMonitorProps.transportControlProps.onPlayPauseClick;

            // Call the play function
            act(() => {
                playFn();
            });

            // Force rerender to ensure state updates are processed
            rerender();

            // Check if source is now playing
            expect(result.current.sourceMonitorProps.isPlaying).toBe(true);

            // Get the pause function from the updated result (important!)
            const pauseFn = result.current.sourceMonitorProps.transportControlProps.onPlayPauseClick;

            // Call the pause function
            act(() => {
                pauseFn();
            });

            // Force rerender again
            rerender();

            // Check if source is now paused
            expect(result.current.sourceMonitorProps.isPlaying).toBe(false);
        });

        it('should handle program monitor play/pause', () => {
            // Act
            const { result, rerender } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.programMonitorProps.isPlaying).toBe(false);

            // Capture the play function
            const playFn = result.current.programMonitorProps.transportControlProps.onPlayPauseClick;

            // Call the play function
            act(() => {
                playFn();
            });

            // Force rerender to ensure state updates are processed
            rerender();

            // Check if program is now playing
            expect(result.current.programMonitorProps.isPlaying).toBe(true);

            // Get the pause function from the updated result (important!)
            const pauseFn = result.current.programMonitorProps.transportControlProps.onPlayPauseClick;

            // Call the pause function
            act(() => {
                pauseFn();
            });

            // Force rerender again
            rerender();

            // Check if program is now paused
            expect(result.current.programMonitorProps.isPlaying).toBe(false);
        });

        it('should handle source monitor step forward/backward', () => {
            // Arrange
            const mockClip: Clip = {
                id: 'test-id',
                title: 'Test Clip',
                thumbnailUrl: 'test-url',
                duration: 60,
                selected: true
            };

            // Set up mock clip
            mockClipViewerImpl.clips = [mockClip];

            // Act
            const { result } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.sourceMonitorProps.currentTime).toBe(0);

            // Get step handlers
            const onStepForwardClick = result.current.sourceMonitorProps.transportControlProps.onStepForwardClick;
            const onStepBackwardClick = result.current.sourceMonitorProps.transportControlProps.onStepBackwardClick;

            // Step forward
            act(() => {
                onStepForwardClick();
            });

            // Check time was incremented by 1/24 second
            expect(result.current.sourceMonitorProps.currentTime).toBeCloseTo(1 / 24, 5);

            // Step backward
            act(() => {
                onStepBackwardClick();
            });

            // Check time was decremented back to 0
            expect(result.current.sourceMonitorProps.currentTime).toBe(0);
        });

        it('should handle program monitor step forward/backward', () => {
            // Act
            const { result } = renderHook(() => useEditorViewModel());

            // Initial state
            expect(result.current.programMonitorProps.currentTime).toBe(0);

            // Get step handlers
            const onStepForwardClick = result.current.programMonitorProps.transportControlProps.onStepForwardClick;
            const onStepBackwardClick = result.current.programMonitorProps.transportControlProps.onStepBackwardClick;

            // Step forward
            act(() => {
                onStepForwardClick();
            });

            // Check time was incremented by 1/24 second
            expect(result.current.programMonitorProps.currentTime).toBeCloseTo(1 / 24, 5);

            // Step backward
            act(() => {
                onStepBackwardClick();
            });

            // Check time was decremented back to 0
            expect(result.current.programMonitorProps.currentTime).toBe(0);
        });
    });
}); 