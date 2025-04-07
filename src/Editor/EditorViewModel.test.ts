import { renderHook, act } from '@testing-library/react';
import { useEditorViewModel, createEditorViewProps } from './EditorViewModel';
import { Clip } from '../Clip/ClipModel';
import { VideoPanelViewProps } from '../Monitor/VideoPanel/VideoPanelViewModel';
import { TimeRulerViewProps } from '../Monitor/TimeRuler/TimeRulerViewModel';
import { TransportControlViewProps } from '../Monitor/TransportControl/TransportControlViewModel';
import React from 'react';

// Suppress React act warnings
const originalError = console.error;
console.error = function (...args) {
    if (args[0] && typeof args[0] === 'string' && (
        args[0].includes('Warning: An update to') ||
        args[0].includes('not wrapped in act')
    )) {
        return; // Suppress React warnings in tests
    }
    originalError.apply(console, args);
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
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60,
        filePath: 'test-file-path'
    };

    // Setup mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();

        // Create a simple mock clip viewer model
        (useClipViewerViewModel as jest.Mock).mockReturnValue({
            clips: [],
            isLoading: false,
            errorMessage: null,
            onClipClick: jest.fn(),
            onAddClips: jest.fn()
        });

        // Create a simple mock monitor view model
        (useMonitorViewModel as jest.Mock).mockReturnValue({
            title: 'Mock Monitor',
            currentClip: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            videoPanelProps: {
                clip: null,
                currentTime: 0,
                timecode: '00:00:00:00'
            },
            timeRulerProps: {
                currentTime: 0,
                duration: 0,
                progress: 0,
                tickMarks: [],
                onTimeUpdate: jest.fn(),
                onProgressBarClick: jest.fn()
            },
            transportControlProps: {
                isPlaying: false,
                onPlayPauseClick: jest.fn(),
                onStepForwardClick: jest.fn(),
                onStepBackwardClick: jest.fn()
            }
        });
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
                } as TransportControlViewProps
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
                } as TransportControlViewProps
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
        // This is the only test that really matters for our drag-and-drop functionality
        it('should configure the source monitor with drop clip handler', () => {
            // Setup clip viewer model with our mock clip
            const onClipClickSpy = jest.fn();

            const mockClipViewerViewModel = {
                // The clip needs to exist in the array for onClipClick to be called
                clips: [mockClip],
                isLoading: false,
                errorMessage: null,
                onClipClick: onClipClickSpy,
                onAddClips: jest.fn()
            };

            // Important: mock the useClipViewerViewModel to return our mock
            (useClipViewerViewModel as jest.Mock).mockReturnValue(mockClipViewerViewModel);

            // Create a spy for the drop handler that we can inspect
            const mockDropHandler = jest.fn();

            // Setup the useMonitorViewModel mock to capture the onDropClip argument
            (useMonitorViewModel as jest.Mock).mockImplementation((title, clip, isPlaying, currentTime, duration, onTimeUpdate, onDropClip) => {
                // For the Source monitor, save the drop handler for testing
                if (title === 'Source' && onDropClip) {
                    // Store a reference to the real function
                    mockDropHandler.mockImplementation(onDropClip);
                }

                // Return a mock monitor props object
                return {
                    title,
                    currentClip: clip,
                    isPlaying,
                    currentTime,
                    duration,
                    videoPanelProps: {
                        clip,
                        currentTime,
                        timecode: '00:00:00:00'
                    },
                    timeRulerProps: {
                        currentTime,
                        duration,
                        progress: 0,
                        tickMarks: [],
                        onTimeUpdate: jest.fn(),
                        onProgressBarClick: jest.fn()
                    },
                    transportControlProps: {
                        isPlaying,
                        onPlayPauseClick: jest.fn(),
                        onStepForwardClick: jest.fn(),
                        onStepBackwardClick: jest.fn()
                    }
                };
            });

            // Render the hook
            const { result } = renderHook(() => useEditorViewModel());

            // Reset spies before testing
            onClipClickSpy.mockClear();
            mockDropHandler.mockClear();

            // Create a test clip to drop with same ID but different thumbnail
            const droppedClip = {
                ...mockClip,
                thumbnailUrl: 'new-test-url'
            };

            // Call our captured drop handler
            act(() => {
                mockDropHandler(droppedClip);
            });

            // Verify the clip selection behavior
            expect(onClipClickSpy).toHaveBeenCalledWith(mockClip.id);
        });
    });
}); 