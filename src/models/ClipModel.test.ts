import {
    Clip,
    selectClip,
    deselectClip,
    updateClipTitle,
    selectClipById,
    getSelectedClips,
    getTotalDuration
} from './ClipModel';

describe('ClipModel', () => {
    // Sample clips for testing
    const clip1: Clip = {
        id: '1',
        title: 'First Clip',
        thumbnailUrl: 'https://example.com/1.jpg',
        duration: 10
    };

    const clip2: Clip = {
        id: '2',
        title: 'Second Clip',
        thumbnailUrl: 'https://example.com/2.jpg',
        duration: 20,
        selected: true
    };

    const clip3: Clip = {
        id: '3',
        title: 'Third Clip',
        thumbnailUrl: 'https://example.com/3.jpg',
        duration: 30
    };

    const clips: Clip[] = [clip1, clip2, clip3];

    describe('selectClip', () => {
        it('should set selected to true', () => {
            const result = selectClip(clip1);
            expect(result).toEqual({
                ...clip1,
                selected: true
            });
            // Original object should be unchanged (immutability)
            expect(clip1.selected).toBeUndefined();
        });

        it('should keep selected as true if already selected', () => {
            const result = selectClip(clip2);
            expect(result).toEqual(clip2);
        });
    });

    describe('deselectClip', () => {
        it('should set selected to false', () => {
            const result = deselectClip(clip2);
            expect(result).toEqual({
                ...clip2,
                selected: false
            });
            // Original object should be unchanged (immutability)
            expect(clip2.selected).toBe(true);
        });
    });

    describe('updateClipTitle', () => {
        it('should update the title', () => {
            const newTitle = 'Updated Title';
            const result = updateClipTitle(clip1, newTitle);
            expect(result).toEqual({
                ...clip1,
                title: newTitle
            });
            // Original object should be unchanged (immutability)
            expect(clip1.title).toBe('First Clip');
        });
    });

    describe('selectClipById', () => {
        it('should select the clip with the given id and deselect others', () => {
            const result = selectClipById(clips, '1');

            expect(result.length).toBe(3);
            expect(result[0].selected).toBe(true); // id: '1'
            expect(result[1].selected).toBe(false); // id: '2' (was selected)
            expect(result[2].selected).toBe(false); // id: '3'

            // Original array should be unchanged (immutability)
            expect(clips[1].selected).toBe(true);
        });
    });

    describe('getSelectedClips', () => {
        it('should return only selected clips', () => {
            const result = getSelectedClips(clips);

            expect(result.length).toBe(1);
            expect(result[0].id).toBe('2');
        });

        it('should return empty array if no clips are selected', () => {
            const unselectedClips = [clip1, clip3];
            const result = getSelectedClips(unselectedClips);

            expect(result.length).toBe(0);
        });
    });

    describe('getTotalDuration', () => {
        it('should return the sum of all clip durations', () => {
            const result = getTotalDuration(clips);

            expect(result).toBe(60); // 10 + 20 + 30
        });

        it('should return 0 for empty array', () => {
            const result = getTotalDuration([]);

            expect(result).toBe(0);
        });
    });
}); 