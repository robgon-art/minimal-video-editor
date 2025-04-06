import { formatTimecode, createVideoPanelViewProps } from './VideoPanelViewModel';
import { Clip } from '../../models/ClipModel';

describe('VideoPanelViewModel', () => {
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60
    };

    describe('formatTimecode', () => {
        it('should format time correctly in HH:MM:SS:FF format', () => {
            expect(formatTimecode(0)).toBe('00:00:00:00');
            expect(formatTimecode(1)).toBe('00:00:01:00');
            expect(formatTimecode(1.5)).toBe('00:00:01:12'); // 1.5 seconds = 1 sec and 12 frames (at 24fps)
            expect(formatTimecode(61)).toBe('00:01:01:00');
            expect(formatTimecode(3661)).toBe('01:01:01:00');
        });
    });

    describe('createVideoPanelViewProps', () => {
        it('should create props with null clip', () => {
            const props = createVideoPanelViewProps(null, 0);
            expect(props).toEqual({
                clip: null,
                currentTime: 0,
                timecode: '00:00:00:00'
            });
        });

        it('should create props with valid clip', () => {
            const props = createVideoPanelViewProps(mockClip, 30);
            expect(props).toEqual({
                clip: mockClip,
                currentTime: 30,
                timecode: '00:00:30:00'
            });
        });
    });
}); 