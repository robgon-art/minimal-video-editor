import {
    isSupportedMediaType,
    validateMediaFile,
    createMetadataObject,
    SUPPORTED_EXTENSIONS
} from './MediaMetadata';

describe('MediaMetadata', () => {
    describe('SUPPORTED_EXTENSIONS', () => {
        it('should contain common video formats', () => {
            expect(SUPPORTED_EXTENSIONS).toContain('mp4');
            expect(SUPPORTED_EXTENSIONS).toContain('mov');
            expect(SUPPORTED_EXTENSIONS).toContain('avi');
        });
    });

    describe('isSupportedMediaType', () => {
        it('should return true for supported extensions', () => {
            expect(isSupportedMediaType('mp4')).toBe(true);
            expect(isSupportedMediaType('mov')).toBe(true);
            expect(isSupportedMediaType('avi')).toBe(true);
        });

        it('should return false for unsupported extensions', () => {
            expect(isSupportedMediaType('jpg')).toBe(false);
            expect(isSupportedMediaType('png')).toBe(false);
            expect(isSupportedMediaType('txt')).toBe(false);
        });

        it('should be case insensitive', () => {
            expect(isSupportedMediaType('MP4')).toBe(true);
            expect(isSupportedMediaType('MOV')).toBe(true);
            expect(isSupportedMediaType('AVI')).toBe(true);
        });
    });

    describe('validateMediaFile', () => {
        it('should return true for supported files', () => {
            expect(validateMediaFile('video.mp4')).toBe(true);
            expect(validateMediaFile('video.mov')).toBe(true);
            expect(validateMediaFile('video.avi')).toBe(true);
        });

        it('should return false for unsupported files', () => {
            expect(validateMediaFile('image.jpg')).toBe(false);
            expect(validateMediaFile('document.pdf')).toBe(false);
            expect(validateMediaFile('text.txt')).toBe(false);
        });

        it('should handle filenames with multiple dots', () => {
            expect(validateMediaFile('video.clip.mp4')).toBe(true);
            expect(validateMediaFile('my.vacation.mov')).toBe(true);
        });

        it('should return false for files with no extension', () => {
            expect(validateMediaFile('noextension')).toBe(false);
        });
    });

    describe('createMetadataObject', () => {
        it('should create metadata object with given values', () => {
            const testDate = new Date();
            const metadata = createMetadataObject(1024, testDate, 60);

            expect(metadata.size).toBe(1024);
            expect(metadata.lastModified instanceof Date).toBe(true);
            expect(metadata.lastModified).toEqual(testDate);
            expect(metadata.durationInSeconds).toBe(60);
        });

        it('should convert timestamp to Date object', () => {
            const timestamp = Date.now();
            const metadata = createMetadataObject(1024, timestamp, 60);

            expect(metadata.lastModified instanceof Date).toBe(true);
            expect(metadata.lastModified.getTime()).toBe(timestamp);
        });

        it('should default to 0 duration if not provided', () => {
            const metadata = createMetadataObject(1024, new Date(), 0);
            expect(metadata.durationInSeconds).toBe(0);
        });
    });
}); 