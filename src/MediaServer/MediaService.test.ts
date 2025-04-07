import fs from 'fs';
import path from 'path';
import { MediaService } from './MediaService';
import { MediaRepository } from './MediaRepository';
import { ThumbnailGenerator } from './ThumbnailGenerator';

// Manual mock for ThumbnailGenerator instead of using jest.mock
const createMockThumbnailGenerator = () => ({
    generateThumbnail: jest.fn().mockResolvedValue({
        durationInSeconds: 30,
        width: 1280,
        height: 720,
        fps: 24
    }),
    extractMetadata: jest.fn().mockResolvedValue({
        durationInSeconds: 30,
        width: 1280,
        height: 720,
        fps: 24
    })
});

// Create test directories
const TEST_MEDIA_PATH = path.join(__dirname, '../../temp_test_service/media');
const TEST_THUMBNAIL_PATH = path.join(__dirname, '../../temp_test_service/media/thumbnails');

describe('MediaService', () => {
    let mediaService: MediaService;
    let mediaRepository: MediaRepository;
    let mockThumbnailGenerator: any;

    // Setup and teardown
    beforeAll(() => {
        // Create test directories
        if (!fs.existsSync(TEST_MEDIA_PATH)) {
            fs.mkdirSync(TEST_MEDIA_PATH, { recursive: true });
        }
        if (!fs.existsSync(TEST_THUMBNAIL_PATH)) {
            fs.mkdirSync(TEST_THUMBNAIL_PATH, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up test directories
        if (fs.existsSync(path.dirname(TEST_MEDIA_PATH))) {
            fs.rmSync(path.dirname(TEST_MEDIA_PATH), { recursive: true, force: true });
        }
    });

    beforeEach(() => {
        // Create fresh instances for each test
        mediaRepository = new MediaRepository({
            mediaPath: TEST_MEDIA_PATH,
            thumbnailPath: TEST_THUMBNAIL_PATH
        });

        // Use manual mock instead of Jest automatic mock
        mockThumbnailGenerator = createMockThumbnailGenerator();

        mediaService = new MediaService(mediaRepository, mockThumbnailGenerator as any);
    });

    it('should upload a media file and generate a thumbnail', async () => {
        // Create test data
        const filename = 'test_upload.mp4';
        const testData = Buffer.from('test video data');

        // Upload the file
        const result = await mediaService.uploadMedia(filename, testData);

        // Verify result
        expect(result).not.toBeNull();
        expect(result?.filename).toBe(filename);
        expect(result?.metadata.durationInSeconds).toBe(30); // From our mock
        expect(result?.metadata.size).toBe(testData.length);

        // Verify file was saved
        const savedFile = await mediaRepository.getMediaFile(filename);
        expect(savedFile).toEqual(testData);

        // Verify thumbnail generator was called
        expect(mockThumbnailGenerator.generateThumbnail).toHaveBeenCalled();
    });

    it('should reject unsupported file types', async () => {
        // Create test data with unsupported extension
        const filename = 'test.txt';
        const testData = Buffer.from('not a video file');

        // Try to upload the file
        const result = await mediaService.uploadMedia(filename, testData);

        // Verify upload was rejected
        expect(result).toBeNull();

        // Verify file was not saved
        const savedFile = await mediaRepository.getMediaFile(filename);
        expect(savedFile).toBeNull();
    });

    it('should list media files with metadata', async () => {
        // Create test files
        const testFiles = ['list_test1.mp4', 'list_test2.mp4'];
        const testData = Buffer.from('test data');

        // Save files
        for (const file of testFiles) {
            await mediaService.uploadMedia(file, testData);
        }

        // Get media list
        const mediaList = await mediaService.getMediaList();

        // Verify list contains our test files
        expect(mediaList.length).toBeGreaterThanOrEqual(testFiles.length);

        // Check that all test files are in the list
        for (const file of testFiles) {
            const found = mediaList.some(item => item.filename === file);
            expect(found).toBe(true);
        }

        // Check that metadata is included
        for (const item of mediaList) {
            expect(item.metadata).toBeDefined();
            expect(item.metadata.size).toBeGreaterThan(0);
            expect(typeof item.metadata.lastModified.getTime).toBe('function');
        }
    });

    it('should get media files by filename', async () => {
        // Create test file
        const filename = 'get_test.mp4';
        const testData = Buffer.from('test video data for get');

        // Save the file
        await mediaService.uploadMedia(filename, testData);

        // Get the file
        const retrievedFile = await mediaService.getMedia(filename);

        // Verify file was retrieved correctly
        expect(retrievedFile).toEqual(testData);
    });

    it('should get thumbnails for media files', async () => {
        // Setup spy to check repository calls
        const getThumbnailFileSpy = jest.spyOn(mediaRepository, 'getThumbnailFile');

        // Create test file
        const filename = 'thumbnail_test.mp4';
        const testData = Buffer.from('test video data for thumbnail');

        // Save the file and generate thumbnail (mock)
        await mediaService.uploadMedia(filename, testData);

        // Get the thumbnail
        await mediaService.getThumbnail(filename);

        // Verify repository was called with correct filename
        expect(getThumbnailFileSpy).toHaveBeenCalledWith('thumbnail_test.jpg');
    });
}); 