import { createMonitorViewProps } from './MonitorViewModel';
import { Clip } from '../models/ClipModel';

// Mock the child component ViewModels
jest.mock('./VideoPanel/VideoPanelViewModel', () => ({
    useVideoPanelViewModel: jest.fn(() => ({ mockVideoPanelProps: true }))
}));

jest.mock('./TimeRuler/TimeRulerViewModel', () => ({
    useTimeRulerViewModel: jest.fn(() => ({ mockTimeRulerProps: true }))
}));

jest.mock('./TransportControl/TransportControlViewModel', () => ({
    useTransportControlViewModel: jest.fn(() => ({ mockTransportControlProps: true }))
}));

describe('MonitorViewModel', () => {
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60
    };

    const mockOnTimeUpdate = jest.fn();

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
                mockOnTimeUpdate
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
                onTimeUpdate: mockOnTimeUpdate
            });
        });
    });
}); 