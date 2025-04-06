import { createTransportControlViewProps } from './TransportControlViewModel';

describe('TransportControlViewModel', () => {
    const mockOnPlay = jest.fn();
    const mockOnPause = jest.fn();
    const mockOnStepForward = jest.fn();
    const mockOnStepBackward = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTransportControlViewProps', () => {
        it('should create props with handlers correctly mapped', () => {
            const props = createTransportControlViewProps(
                false,
                mockOnPlay,
                mockOnPause,
                mockOnStepForward,
                mockOnStepBackward
            );

            expect(props).toEqual({
                isPlaying: false,
                onPlayPauseClick: expect.any(Function),
                onStepForwardClick: mockOnStepForward,
                onStepBackwardClick: mockOnStepBackward
            });
        });

        it('should call onPlay when onPlayPauseClick is called and isPlaying is false', () => {
            const props = createTransportControlViewProps(
                false,
                mockOnPlay,
                mockOnPause,
                mockOnStepForward,
                mockOnStepBackward
            );

            props.onPlayPauseClick();
            expect(mockOnPlay).toHaveBeenCalled();
            expect(mockOnPause).not.toHaveBeenCalled();
        });

        it('should call onPause when onPlayPauseClick is called and isPlaying is true', () => {
            const props = createTransportControlViewProps(
                true,
                mockOnPlay,
                mockOnPause,
                mockOnStepForward,
                mockOnStepBackward
            );

            props.onPlayPauseClick();
            expect(mockOnPause).toHaveBeenCalled();
            expect(mockOnPlay).not.toHaveBeenCalled();
        });
    });
}); 