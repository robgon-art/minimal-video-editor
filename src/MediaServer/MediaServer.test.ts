import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { MediaServer, MediaServerConfig } from './MediaServer';
import { MediaController } from './MediaController';
import { MediaRepository } from './MediaRepository';

// Improved mock implementation that better matches what the controller expects
class MockMediaService {
    private mediaRepository: MediaRepository;

    constructor(mediaRepository: MediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    async getMediaList() {
        const files = await this.mediaRepository.listMediaFiles();
        return files.map(filename => ({
            filename,
            metadata: {
                size: 1024,
                lastModified: new Date(),
                durationInSeconds: 30
            }
        }));
    }

    async uploadMedia(filename: string, data: Buffer) {
        const success = await this.mediaRepository.saveMediaFile(filename, data);
        if (success) {
            return {
                filename,
                metadata: {
                    size: data.length,
                    lastModified: new Date(),
                    durationInSeconds: 30
                }
            };
        }
        return null;
    }

    async getMedia(filename: string) {
        return this.mediaRepository.getMediaFile(filename);
    }

    async getThumbnail(filename: string) {
        const thumbnailFilename = `${path.parse(filename).name}.jpg`;
        return this.mediaRepository.getThumbnailFile(thumbnailFilename);
    }

    async getThumbnailsList() {
        return this.mediaRepository.listThumbnailFiles();
    }

    async getMediaMetadata(filename: string) {
        return {
            size: 1024,
            lastModified: new Date(),
            durationInSeconds: 30
        };
    }
}

// Set up test directories
const TEST_MEDIA_PATH = path.join(__dirname, '../../temp_test_server/media');
const TEST_THUMBNAIL_PATH = path.join(__dirname, '../../temp_test_server/media/thumbnails');

describe('MediaServer', () => {
    let server: MediaServer;
    let mediaRepository: MediaRepository;

    // Setup and teardown
    beforeAll(() => {
        // Create test directories
        if (!fs.existsSync(TEST_MEDIA_PATH)) {
            fs.mkdirSync(TEST_MEDIA_PATH, { recursive: true });
        }
        if (!fs.existsSync(TEST_THUMBNAIL_PATH)) {
            fs.mkdirSync(TEST_THUMBNAIL_PATH, { recursive: true });
        }

        // Create repository
        mediaRepository = new MediaRepository({
            mediaPath: TEST_MEDIA_PATH,
            thumbnailPath: TEST_THUMBNAIL_PATH
        });

        // Create mock service using class instead of functions
        const mockMediaService = new MockMediaService(mediaRepository);

        // Create controller with mock service
        const mediaController = new MediaController(mockMediaService as any);

        // Create server with injected dependencies
        const config: MediaServerConfig = {
            port: 3002, // Different port for tests
            mediaStoragePath: TEST_MEDIA_PATH,
            thumbnailStoragePath: TEST_THUMBNAIL_PATH,
            mediaController // Inject the controller with mocked dependencies
        };

        server = new MediaServer(config);
    });

    // Clear test files between tests to ensure clean state
    beforeEach(() => {
        // Clean any existing test files
        const mediaFiles = fs.readdirSync(TEST_MEDIA_PATH)
            .filter(f => f !== 'thumbnails');

        for (const file of mediaFiles) {
            fs.unlinkSync(path.join(TEST_MEDIA_PATH, file));
        }

        const thumbnailFiles = fs.readdirSync(TEST_THUMBNAIL_PATH);
        for (const file of thumbnailFiles) {
            fs.unlinkSync(path.join(TEST_THUMBNAIL_PATH, file));
        }
    });

    afterAll(() => {
        // Clean up test directories
        if (fs.existsSync(path.dirname(TEST_MEDIA_PATH))) {
            fs.rmSync(path.dirname(TEST_MEDIA_PATH), { recursive: true, force: true });
        }
    });

    // Test listing media files
    it('GET /media should return a list of media files', async () => {
        // Create a test file directly in the file system
        const testFileName = 'server_test.mp4';
        const testFilePath = path.join(TEST_MEDIA_PATH, testFileName);
        fs.writeFileSync(testFilePath, 'test data');

        // Make request to the server
        const response = await request(server.getApp())
            .get('/media')
            .expect('Content-Type', /json/)
            .expect(200);

        // Verify response
        expect(Array.isArray(response.body)).toBe(true);

        // Check if our test file is in the response
        const foundFile = response.body.find((file: any) =>
            file.filename === testFileName
        );

        expect(foundFile).toBeDefined();
        expect(foundFile.metadata).toBeDefined();
        expect(foundFile.metadata.size).toBeGreaterThan(0);
    });

    // Test file upload
    it('POST /media should upload a media file', async () => {
        // Create test data
        const testFileName = 'upload_test.mp4';
        const testFileBuffer = Buffer.from('test upload data');

        // Upload the file
        const response = await request(server.getApp())
            .post('/media')
            .attach('file', testFileBuffer, testFileName)
            .expect(201);

        // Verify response
        expect(response.body).toBeDefined();
        expect(response.body.filename).toBe(testFileName);
        expect(response.body.metadata).toBeDefined();

        // Verify file was saved
        const filePath = path.join(TEST_MEDIA_PATH, testFileName);
        expect(fs.existsSync(filePath)).toBe(true);
    });

    // Test getting a media file
    it('GET /media/:filename should return the media file', async () => {
        // Create a test file directly in the file system
        const testFileName = 'get_test.mp4';
        const testData = 'test media data';
        const testFilePath = path.join(TEST_MEDIA_PATH, testFileName);

        fs.writeFileSync(testFilePath, testData);

        // Make request to the server
        const response = await request(server.getApp())
            .get(`/media/${testFileName}`)
            .expect('Content-Type', 'video/mp4')
            .expect(200);

        // Verify response
        expect(response.body).toBeDefined();
        expect(response.body.toString()).toBe(testData);
    });

    // Test listing thumbnails
    it('GET /thumbnails should return a list of thumbnail files', async () => {
        // Create a test thumbnail directly in the file system
        const testFileName = 'test_thumb.jpg';
        const testFilePath = path.join(TEST_THUMBNAIL_PATH, testFileName);

        fs.writeFileSync(testFilePath, 'test thumbnail data');

        // Make request to the server
        const response = await request(server.getApp())
            .get('/thumbnails')
            .expect('Content-Type', /json/)
            .expect(200);

        // Verify response
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toContain(testFileName);
    });

    // Test getting a thumbnail
    it('GET /thumbnails/:filename should return the thumbnail', async () => {
        // Create a test file and thumbnail
        const mediaFileName = 'thumb_get_test.mp4';
        const thumbnailFileName = 'thumb_get_test.jpg';
        const thumbnailData = 'test thumbnail data';

        // Create the media file
        fs.writeFileSync(path.join(TEST_MEDIA_PATH, mediaFileName), 'test media data');

        // Create the thumbnail file
        fs.writeFileSync(path.join(TEST_THUMBNAIL_PATH, thumbnailFileName), thumbnailData);

        // Make request to the server
        const response = await request(server.getApp())
            .get(`/thumbnails/${mediaFileName}`)
            .expect('Content-Type', 'image/jpeg')
            .expect(200);

        // Verify response
        expect(response.body).toBeDefined();
        expect(response.body.toString()).toBe(thumbnailData);
    });

    // Test handling of invalid file types
    it('POST /media should reject invalid file types', async () => {
        // Create test data with unsupported extension
        const testFileName = 'invalid.txt';
        const testFileBuffer = Buffer.from('not a video file');

        // Upload the file
        await request(server.getApp())
            .post('/media')
            .attach('file', testFileBuffer, testFileName)
            .expect(400); // Bad request

        // Verify file was not saved
        const filePath = path.join(TEST_MEDIA_PATH, testFileName);
        expect(fs.existsSync(filePath)).toBe(false);
    });
});