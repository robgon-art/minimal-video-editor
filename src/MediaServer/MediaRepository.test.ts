import fs from 'fs';
import path from 'path';
import { MediaRepository } from './MediaRepository';

// Create a temporary test directory
const TEST_MEDIA_PATH = path.join(__dirname, '../../temp_test/media');
const TEST_THUMBNAIL_PATH = path.join(__dirname, '../../temp_test/media/thumbnails');

describe('MediaRepository', () => {
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
        if (fs.existsSync(TEST_MEDIA_PATH)) {
            fs.rmSync(TEST_MEDIA_PATH, { recursive: true, force: true });
        }
    });

    // Create a new repository instance for each test
    let repository: MediaRepository;

    beforeEach(() => {
        repository = new MediaRepository({
            mediaPath: TEST_MEDIA_PATH,
            thumbnailPath: TEST_THUMBNAIL_PATH
        });
    });

    it('should save and retrieve a media file', async () => {
        // Create test data
        const filename = 'test_video.mp4';
        const testData = Buffer.from('test data');

        // Save the file
        const saveResult = await repository.saveMediaFile(filename, testData);
        expect(saveResult).toBe(true);

        // Check if file exists
        const filePath = path.join(TEST_MEDIA_PATH, filename);
        expect(fs.existsSync(filePath)).toBe(true);

        // Retrieve the file
        const retrievedData = await repository.getMediaFile(filename);
        expect(retrievedData).toEqual(testData);
    });

    it('should save and retrieve a thumbnail file', async () => {
        // Create test data
        const filename = 'test_thumbnail.jpg';
        const testData = Buffer.from('test thumbnail data');

        // Save the file
        const saveResult = await repository.saveThumbnailFile(filename, testData);
        expect(saveResult).toBe(true);

        // Check if file exists
        const filePath = path.join(TEST_THUMBNAIL_PATH, filename);
        expect(fs.existsSync(filePath)).toBe(true);

        // Retrieve the file
        const retrievedData = await repository.getThumbnailFile(filename);
        expect(retrievedData).toEqual(testData);
    });

    it('should list media files correctly', async () => {
        // Create test files
        const testFiles = ['test1.mp4', 'test2.mp4', 'test3.mp4'];
        const testData = Buffer.from('test data');

        // Save files
        for (const file of testFiles) {
            await repository.saveMediaFile(file, testData);
        }

        // Also save an unsupported file
        fs.writeFileSync(path.join(TEST_MEDIA_PATH, 'test.txt'), 'test text file');

        // List files
        const listedFiles = await repository.listMediaFiles();

        // Check if all test files are listed
        for (const file of testFiles) {
            expect(listedFiles).toContain(file);
        }

        // Check that the unsupported file is not listed
        expect(listedFiles).not.toContain('test.txt');
    });

    it('should get media file path correctly', async () => {
        const filename = 'test_video.mp4';
        const expectedPath = path.join(TEST_MEDIA_PATH, filename);

        const filePath = await repository.getMediaFilePath(filename);
        expect(filePath).toEqual(expectedPath);
    });

    it('should get thumbnail file path correctly', async () => {
        const videoFilename = 'test_video.mp4';
        const expectedThumbnailFilename = 'test_video.jpg';
        const expectedPath = path.join(TEST_THUMBNAIL_PATH, expectedThumbnailFilename);

        const filePath = await repository.getThumbnailFilePath(videoFilename);
        expect(filePath).toEqual(expectedPath);
    });

    it('should get basic metadata for a media file', async () => {
        // Create a test file
        const filename = 'metadata_test.mp4';
        const testData = Buffer.from('test data for metadata');

        // Save the file
        await repository.saveMediaFile(filename, testData);

        // Get metadata
        const metadata = await repository.getMediaMetadata(filename);

        // Check if metadata exists and has the right properties
        expect(metadata).not.toBeNull();
        expect(metadata?.size).toBe(testData.length);
        expect(typeof metadata?.lastModified.getTime).toBe('function');
        expect(metadata?.durationInSeconds).toBe(0); // Default value
    });

    it('should handle errors gracefully when file not found', async () => {
        // Try to get a non-existent file
        const nonExistentFile = await repository.getMediaFile('nonexistent.mp4');
        expect(nonExistentFile).toBeNull();

        // Try to get metadata for a non-existent file
        const nonExistentMetadata = await repository.getMediaMetadata('nonexistent.mp4');
        expect(nonExistentMetadata).toBeNull();

        // Try to get a non-existent thumbnail
        const nonExistentThumbnail = await repository.getThumbnailFile('nonexistent.jpg');
        expect(nonExistentThumbnail).toBeNull();
    });
}); 