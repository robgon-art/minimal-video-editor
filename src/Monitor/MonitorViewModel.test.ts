import { renderHook, act } from '@testing-library/react-hooks';
import { createMonitorViewProps, useMonitorViewModel } from './MonitorViewModel';
import { Clip } from '../Clip/ClipModel';

// Mock the child component ViewModels with proper return values
jest.mock('./VideoPanel/VideoPanelViewModel', () => ({
    useVideoPanelViewModel: jest.fn(() => ({ mockVideoPanelProps: true }))
}));

jest.mock('./TimeRuler/TimeRulerViewModel', () => ({
    useTimeRulerViewModel: jest.fn(() => ({
        mockTimeRulerProps: true,
        onProgressBarClick: jest.fn((event) => { })
    }))
}));

jest.mock('./TransportControl/TransportControlViewModel', () => ({
    useTransportControlViewModel: jest.fn(() => ({
        mockTransportControlProps: true,
        onPlayPauseClick: jest.fn(),
        onStepForwardClick: jest.fn(),
        onStepBackwardClick: jest.fn()
    }))
}));

describe('MonitorViewModel', () => {
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60
    };

    const mockOnTimeUpdate = jest.fn();
    const mockOnDropClip = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createMonitorViewProps', () => {
        it('should correctly create props for the view', () => {
            const props = createMonitorViewProps(
                'Test Monitor',
                mockClip,
                true,
                30,
                60,
                { mockVideoPanelProps: true } as any,
                { mockTimeRulerProps: true } as any,
                { mockTransportControlProps: true } as any,
                mockOnDropClip
            );

            expect(props).toEqual({
                title: 'Test Monitor',
                currentClip: mockClip,
                isPlaying: true,
                currentTime: 30,
                duration: 60,
                videoPanelProps: { mockVideoPanelProps: true },
                timeRulerProps: { mockTimeRulerProps: true },
                transportControlProps: { mockTransportControlProps: true },
                onDropClip: mockOnDropClip,
                videoPanelRef: undefined
            });
        });
    });

    describe('useMonitorViewModel', () => {
        // Create a mock for the videoPanelRef
        const mockVideoPanelRef = {
            current: {
                play: jest.fn(),
                pause: jest.fn(),
                stepForward: jest.fn(),
                stepBackward: jest.fn(),
                getCurrentTime: jest.fn()
            }
        };

        beforeEach(() => {
            mockVideoPanelRef.current.getCurrentTime.mockReturnValue(10);

            // Reset our imported mocks before each test
            const { useTimeRulerViewModel } = require('./TimeRuler/TimeRulerViewModel');
            const { useTransportControlViewModel } = require('./TransportControl/TransportControlViewModel');

            // Setup the mocks to track handler calls directly
            const mockOnTimeUpdateHandler = jest.fn();
            const mockHandlePlay = jest.fn();
            const mockHandlePause = jest.fn();
            const mockHandleStepForward = jest.fn();
            const mockHandleStepBackward = jest.fn();

            // Reset the implementations
            useTimeRulerViewModel.mockImplementation((currentTime: number, duration: number, onTimeUpdate: (time: number) => void) => {
                return {
                    progress: (currentTime / (duration || 1)) * 100,
                    tickMarks: duration > 0 ? [0, duration / 4, duration / 2, (duration * 3) / 4, duration] : [],
                    onProgressBarClick: (event: { currentTarget: { getBoundingClientRect: () => { left: number, width: number } }, clientX: number }) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const clickPosition = event.clientX - rect.left;
                        const percentage = clickPosition / rect.width;
                        const newTime = percentage * duration;
                        onTimeUpdate(newTime);
                    }
                };
            });

            useTransportControlViewModel.mockImplementation((
                isPlaying: boolean,
                onPlay: () => void,
                onPause: () => void,
                onStepForward: () => void,
                onStepBackward: () => void
            ) => {
                return {
                    isPlaying,
                    onPlayPauseClick: isPlaying ? onPause : onPlay,
                    onStepForwardClick: onStepForward,
                    onStepBackwardClick: onStepBackward
                };
            });
        });

        it('should initialize with the provided values', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    true,  // initially playing
                    15,    // initial current time
                    60     // duration
                )
            );

            expect(result.current.title).toBe('Test Monitor');
            expect(result.current.currentClip).toBe(mockClip);
            expect(result.current.isPlaying).toBe(true);
            expect(result.current.currentTime).toBe(15);
            expect(result.current.duration).toBe(60);
        });

        it('should handle time updates correctly', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    false,
                    0,
                    60,
                    mockOnTimeUpdate
                )
            );

            // Create a mock event that would set time to 30 seconds
            const mockEvent = {
                currentTarget: {
                    getBoundingClientRect: () => ({
                        left: 0,
                        width: 200
                    })
                },
                clientX: 100 // 50% of the bar width
            } as any;

            // Trigger the progress bar click through the timeRulerProps
            act(() => {
                result.current.timeRulerProps.onProgressBarClick(mockEvent);
            });

            // Check that callback was called with 30 seconds (50% of 60)
            expect(mockOnTimeUpdate).toHaveBeenCalledWith(30);
        });

        it('should handle play correctly', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    false,
                    0,
                    60,
                    undefined,
                    undefined,
                    mockVideoPanelRef as any
                )
            );

            // Call the play/pause handler (should play since isPlaying is false)
            act(() => {
                result.current.transportControlProps.onPlayPauseClick();
            });

            expect(mockVideoPanelRef.current.play).toHaveBeenCalled();
        });

        it('should handle pause correctly', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    true,  // initially playing
                    0,
                    60,
                    undefined,
                    undefined,
                    mockVideoPanelRef as any
                )
            );

            // Call the play/pause handler (should pause since isPlaying is true)
            act(() => {
                result.current.transportControlProps.onPlayPauseClick();
            });

            expect(mockVideoPanelRef.current.pause).toHaveBeenCalled();
        });

        it('should handle step forward correctly', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    false,
                    0,
                    60,
                    mockOnTimeUpdate,
                    undefined,
                    mockVideoPanelRef as any
                )
            );

            // Call the step forward handler
            act(() => {
                result.current.transportControlProps.onStepForwardClick();
            });

            expect(mockVideoPanelRef.current.stepForward).toHaveBeenCalled();
            expect(mockVideoPanelRef.current.getCurrentTime).toHaveBeenCalled();
            expect(mockOnTimeUpdate).toHaveBeenCalledWith(10); // Mock returns 10
        });

        it('should handle step backward correctly', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    false,
                    20,
                    60,
                    mockOnTimeUpdate,
                    undefined,
                    mockVideoPanelRef as any
                )
            );

            // Call the step backward handler
            act(() => {
                result.current.transportControlProps.onStepBackwardClick();
            });

            expect(mockVideoPanelRef.current.stepBackward).toHaveBeenCalled();
            expect(mockVideoPanelRef.current.getCurrentTime).toHaveBeenCalled();
            expect(mockOnTimeUpdate).toHaveBeenCalledWith(10); // Mock returns 10
        });

        it('should not call video methods if videoPanelRef is not provided', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    false,
                    0,
                    60
                )
            );

            // Call handlers that would normally use videoPanelRef
            act(() => {
                result.current.transportControlProps.onPlayPauseClick();
                result.current.transportControlProps.onStepForwardClick();
                result.current.transportControlProps.onStepBackwardClick();
            });

            // Just verifying no errors were thrown (videoPanelRef checks work)
            expect(result.current.isPlaying).toBe(false);
        });

        it('should handle null current clip', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    null,
                    false,
                    0,
                    0
                )
            );

            expect(result.current.currentClip).toBeNull();
            expect(result.current.duration).toBe(0);
        });

        it('should properly forward onDropClip callback', () => {
            const { result } = renderHook(() =>
                useMonitorViewModel(
                    'Test Monitor',
                    mockClip,
                    false,
                    0,
                    60,
                    undefined,
                    mockOnDropClip
                )
            );

            expect(result.current.onDropClip).toBe(mockOnDropClip);
        });
    });
}); 