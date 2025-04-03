import { Clip } from '../models/ClipModel';
import {
    formatTitle,
    enhanceClip,
    formatAndSelectClip,
    processClips,
    sortClipsByDuration,
    filterClipsByMinDuration
} from './ClipUtils';

describe('ClipUtils', () => {
    // Sample data for tests
    const clips: Clip[] = [
        {
            id: '1',
            title: 'short clip',
            thumbnailUrl: 'https://example.com/1.jpg',
            duration: 10
        },
        {
            id: '2',
            title: '   title  with extra   spaces   ',
            thumbnailUrl: 'https://example.com/2.jpg',
            duration: 30
        },
        {
            id: '3',
            title: 'this is a very long title that will need to be truncated',
            thumbnailUrl: 'https://example.com/3.jpg',
            duration: 20
        }
    ];

    describe('formatTitle', () => {
        it('should normalize, capitalize, and truncate titles', () => {
            expect(formatTitle('   hello  world   ')).toBe('Hello world');

            const longTitle = 'this is a very long title that will need to be truncated';
            expect(formatTitle(longTitle)).toBe('This is a very long...');
        });
    });

    describe('enhanceClip', () => {
        it('should transform clip title while preserving other properties', () => {
            const clip = clips[1]; // Title with extra spaces
            const result = enhanceClip(clip);

            expect(result.id).toBe(clip.id);
            expect(result.thumbnailUrl).toBe(clip.thumbnailUrl);
            expect(result.duration).toBe(clip.duration);
            expect(result.title).toBe('Title with extra spaces');
        });
    });

    describe('formatAndSelectClip', () => {
        it('should format the clip title and select the clip', () => {
            const clip = clips[0]; // "short clip"
            const result = formatAndSelectClip(clip);

            expect(result.title).toBe('Short clip');
            expect(result.selected).toBe(true);
        });
    });

    describe('processClips', () => {
        it('should process all clips in an array', () => {
            const result = processClips(clips);

            expect(result.length).toBe(3);
            expect(result[0].title).toBe('Short clip');
            expect(result[1].title).toBe('Title with extra spaces');
            expect(result[2].title).toBe('This is a very long...');
        });
    });

    describe('sortClipsByDuration', () => {
        it('should sort clips by duration in ascending order', () => {
            const result = sortClipsByDuration(clips);

            expect(result[0].id).toBe('1'); // 10 seconds
            expect(result[1].id).toBe('3'); // 20 seconds
            expect(result[2].id).toBe('2'); // 30 seconds
        });

        it('should not modify the original array', () => {
            const original = [...clips];
            sortClipsByDuration(clips);

            expect(clips[0].id).toBe(original[0].id);
            expect(clips[1].id).toBe(original[1].id);
            expect(clips[2].id).toBe(original[2].id);
        });
    });

    describe('filterClipsByMinDuration', () => {
        it('should filter clips that meet minimum duration', () => {
            const filterMin20 = filterClipsByMinDuration(20);
            const result = filterMin20(clips);

            expect(result.length).toBe(2);
            expect(result[0].id).toBe('2');
            expect(result[1].id).toBe('3');
        });

        it('should return all clips if minimum is 0', () => {
            const filterMin0 = filterClipsByMinDuration(0);
            const result = filterMin0(clips);

            expect(result.length).toBe(3);
        });

        it('should return empty array if no clips meet criteria', () => {
            const filterMin100 = filterClipsByMinDuration(100);
            const result = filterMin100(clips);

            expect(result.length).toBe(0);
        });
    });
}); 