import { renderHook } from '@testing-library/react';
import { useEditorViewModel, createEditorViewProps } from './EditorViewModel';
import { Clip } from '../Clip/ClipModel';
import { VideoPanelViewProps } from '../Monitor/VideoPanel/VideoPanelViewModel';
import { TimeRulerViewProps } from '../Monitor/TimeRuler/TimeRulerViewModel';
import { TransportControlViewProps } from '../Monitor/TransportControl/TransportControlViewModel';
import React from 'react';

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
            const mockClipViewerViewModel = {
                clips: [mockClip],
                isLoading: false,
                errorMessage: null,
                onClipClick: jest.fn(),
                onAddClips: jest.fn()
            };

            (useClipViewerViewModel as jest.Mock).mockReturnValue(mockClipViewerViewModel);

            // Render the hook
            renderHook(() => useEditorViewModel());

            // Check that useMonitorViewModel was called with the drop handler
            const calls = (useMonitorViewModel as jest.Mock).mock.calls;

            // The first call should be for the source monitor
            expect(calls[0][0]).toBe('Source');

            // The last argument (dropClipHandler) should be a function
            const dropHandler = calls[0][calls[0].length - 1];
            expect(typeof dropHandler).toBe('function');

            // Call the handler
            dropHandler(mockClip);

            // It should call the onClipClick method from clipViewerViewModel
            expect(mockClipViewerViewModel.onClipClick).toHaveBeenCalledWith(mockClip.id);
        });
    });
}); 