import { formatTimecode, createVideoPanelViewProps, useVideoPanelViewModel } from './VideoPanelViewModel';
import { Clip } from '../../Clip/ClipModel';
import { renderHook } from '@testing-library/react';

describe('VideoPanelViewModel', () => {
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60,
        filePath: 'test-file-path'
    };

    describe('formatTimecode', () => {
        it('should format time correctly in HH:MM:SS:FF format', () => {
            expect(formatTimecode(0)).toBe('00:00:00:00');
            expect(formatTimecode(1)).toBe('00:00:01:00');
            expect(formatTimecode(1.5)).toBe('00:00:01:12'); // 1.5 seconds = 1 sec and 12 frames (at 24fps)
            expect(formatTimecode(61)).toBe('00:01:01:00');
            expect(formatTimecode(3661)).toBe('01:01:01:00');
        });

        it('should handle fractional seconds correctly', () => {
            expect(formatTimecode(10.25)).toBe('00:00:10:06'); // 0.25 * 24 = 6 frames
            expect(formatTimecode(10.5)).toBe('00:00:10:12'); // 0.5 * 24 = 12 frames
            expect(formatTimecode(10.75)).toBe('00:00:10:18'); // 0.75 * 24 = 18 frames
            expect(formatTimecode(10.99)).toBe('00:00:10:23'); // 0.99 * 24 = 23.76 frames (rounded to 23)
        });

        it('should handle large time values', () => {
            expect(formatTimecode(3600)).toBe('01:00:00:00'); // 1 hour
            expect(formatTimecode(7200)).toBe('02:00:00:00'); // 2 hours
            expect(formatTimecode(86400)).toBe('24:00:00:00'); // 24 hours
        });

        it('should handle negative time values by treating them as 0', () => {
            expect(formatTimecode(-1)).toBe('00:00:00:00');
            expect(formatTimecode(-10.5)).toBe('00:00:00:00');
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

        it('should format currentTime into timecode', () => {
            const props = createVideoPanelViewProps(mockClip, 90.5);
            expect(props.timecode).toBe('00:01:30:12');
        });
    });

    describe('useVideoPanelViewModel', () => {
        it('should return memoized view props when inputs are the same', () => {
            const { result, rerender } = renderHook(
                ({ clip, currentTime }) => useVideoPanelViewModel(clip, currentTime),
                { initialProps: { clip: mockClip, currentTime: 10 } }
            );

            const firstResult = result.current;

            // Rerender with the same props
            rerender({ clip: mockClip, currentTime: 10 });

            // Should be the same object reference (memoized)
            expect(result.current).toBe(firstResult);
        });

        it('should return new view props when clip changes', () => {
            const { result, rerender } = renderHook(
                ({ clip, currentTime }) => useVideoPanelViewModel(clip, currentTime),
                { initialProps: { clip: mockClip, currentTime: 10 } }
            );

            const firstResult = result.current;

            // Rerender with different clip
            const newClip = { ...mockClip, id: 'new-id' };
            rerender({ clip: newClip, currentTime: 10 });

            // Should be a different object reference
            expect(result.current).not.toBe(firstResult);
            expect(result.current.clip).toBe(newClip);
        });

        it('should return new view props when currentTime changes', () => {
            const { result, rerender } = renderHook(
                ({ clip, currentTime }) => useVideoPanelViewModel(clip, currentTime),
                { initialProps: { clip: mockClip, currentTime: 10 } }
            );

            const firstResult = result.current;

            // Rerender with different currentTime
            rerender({ clip: mockClip, currentTime: 20 });

            // Should be a different object reference
            expect(result.current).not.toBe(firstResult);
            expect(result.current.currentTime).toBe(20);
            expect(result.current.timecode).toBe('00:00:20:00');
        });

        it('should handle null clip', () => {
            const { result } = renderHook(
                ({ clip, currentTime }) => useVideoPanelViewModel(clip, currentTime),
                { initialProps: { clip: null, currentTime: 0 } }
            );

            expect(result.current).toEqual({
                clip: null,
                currentTime: 0,
                timecode: '00:00:00:00'
            });
        });
    });
}); 