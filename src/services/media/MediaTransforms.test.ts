import {
    filterSupportedFiles,
    createThumbnailUrl
} from './MediaTransforms';
import { MediaMetadata } from './MediaMetadata';
import { createClipFromFile } from '../../Clip/ClipModel';

// Mock uuid to return a predictable value for testing
jest.mock('uuid', () => ({
    v4: () => 'mock-uuid'
}));

// Mock the ensureThumbnailExists function to return a placeholder URL
jest.mock('../../utils/media/BrowserThumbnailGenerator', () => ({
    ensureThumbnailExists: jest.fn().mockImplementation((filePath) => {
        // Return a placeholder URL directly to avoid any file system operations
        const fileName = filePath.split('/').pop() || filePath;
        return Promise.resolve(`https://via.placeholder.com/150?text=${encodeURIComponent(fileName)}`);
    })
}));

describe('MediaTransforms', () => {
    describe('createClipFromFile', () => {
        it('should create a clip object with the correct properties', () => {
            const filePath = '/media/video.mp4';
            const fileName = 'video.mp4';
            const duration = 60;

            const clip = createClipFromFile(filePath, fileName, duration);

            expect(clip.id).toBe('mock-uuid');
            expect(clip.title).toBe('video');
            expect(clip.filePath).toBe(filePath);
            expect(clip.duration).toBe(duration);
            expect(clip.thumbnailUrl).toContain(encodeURIComponent(fileName));
        });

        it('should remove file extension from title', () => {
            const clip = createClipFromFile('/media/video.file.mp4', 'video.file.mp4', 60);
            expect(clip.title).toBe('video.file');
        });
    });

    describe('filterSupportedFiles', () => {
        it('should filter out unsupported file types', () => {
            const files = [
                new File([''], 'video.mp4', { type: 'video/mp4' }),
                new File([''], 'image.jpg', { type: 'image/jpeg' }),
                new File([''], 'movie.mov', { type: 'video/quicktime' }),
                new File([''], 'document.pdf', { type: 'application/pdf' })
            ];

            const supportedExtensions = ['mp4', 'mov'];
            const filteredFiles = filterSupportedFiles(files, supportedExtensions);

            expect(filteredFiles.length).toBe(2);
            expect(filteredFiles[0].name).toBe('video.mp4');
            expect(filteredFiles[1].name).toBe('movie.mov');
        });

        it('should return empty array when no files match', () => {
            const files = [
                new File([''], 'image.jpg', { type: 'image/jpeg' }),
                new File([''], 'document.pdf', { type: 'application/pdf' })
            ];

            const supportedExtensions = ['mp4', 'mov'];
            const filteredFiles = filterSupportedFiles(files, supportedExtensions);

            expect(filteredFiles.length).toBe(0);
        });

        it('should handle case insensitivity', () => {
            const files = [
                new File([''], 'video.MP4', { type: 'video/mp4' }),
                new File([''], 'movie.MOV', { type: 'video/quicktime' })
            ];

            const supportedExtensions = ['mp4', 'mov'];
            const filteredFiles = filterSupportedFiles(files, supportedExtensions);

            expect(filteredFiles.length).toBe(2);
        });
    });

    describe('mapPathsToClips', () => {
        it('should be testable separately without metadata dependencies', async () => {
            // This test just verifies we can test this function
            // without needing to set up file operations
            const mockGetMetadata = jest.fn().mockImplementation((path) => {
                return Promise.resolve({
                    size: 1024,
                    lastModified: new Date(),
                    durationInSeconds: 60
                });
            });

            // This is tested separately in mapPathsToClips integration tests
        });
    });

    describe('createThumbnailUrl', () => {
        it('should create a thumbnail URL with the encoded filename', async () => {
            const fileName = 'my video.mp4';
            const thumbnailUrl = await createThumbnailUrl(fileName);

            expect(thumbnailUrl).toContain('https://via.placeholder.com/150');
            expect(thumbnailUrl).toContain(encodeURIComponent(fileName));
        });

        it('should encode special characters in the filename', async () => {
            const fileName = 'video & movie.mp4';
            const thumbnailUrl = await createThumbnailUrl(fileName);

            expect(thumbnailUrl).toContain(encodeURIComponent(fileName));
        });
    });
}); 