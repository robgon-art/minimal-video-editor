import { MediaServiceClient } from './MediaServiceClient';

// Mock fetch for testing
global.fetch = jest.fn();

describe('MediaServiceClient', () => {
    let client: MediaServiceClient;

    beforeEach(() => {
        client = new MediaServiceClient('http://localhost:3001');

        // Reset the fetch mock
        (global.fetch as jest.Mock).mockReset();
    });

    it('should scan media folder and return clips', async () => {
        // Mock the fetch response for GET /media
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([
                {
                    filename: 'test1.mp4',
                    metadata: {
                        size: 1024,
                        lastModified: new Date().toISOString(),
                        durationInSeconds: 30
                    }
                },
                {
                    filename: 'test2.mp4',
                    metadata: {
                        size: 2048,
                        lastModified: new Date().toISOString(),
                        durationInSeconds: 60
                    }
                }
            ])
        });

        // Call the method
        const clips = await client.scanMediaFolder();

        // Check results
        expect(clips).toHaveLength(2);

        // Verify clip properties
        expect(clips[0].title).toBe('test1');
        expect(clips[0].duration).toBe(30);
        expect(clips[0].filePath).toBe('/media/test1.mp4');

        expect(clips[1].title).toBe('test2');
        expect(clips[1].duration).toBe(60);
        expect(clips[1].filePath).toBe('/media/test2.mp4');

        // Verify fetch was called correctly
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/media');
    });

    it('should import media files', async () => {
        // Create a mock File
        const mockFile = new File(['test data'], 'test.mp4', { type: 'video/mp4' });

        // Mock FormData
        const mockFormDataAppend = jest.fn();
        global.FormData = jest.fn().mockImplementation(() => ({
            append: mockFormDataAppend
        }));

        // Mock the fetch response for POST /media
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({
                filename: 'uploaded.mp4',
                metadata: {
                    size: 4096,
                    lastModified: new Date().toISOString(),
                    durationInSeconds: 120
                }
            })
        });

        // Call the method
        const clips = await client.importMediaFiles([mockFile]);

        // Check results
        expect(clips).toHaveLength(1);

        // Verify clip properties
        expect(clips[0].title).toBe('uploaded');
        expect(clips[0].duration).toBe(120);
        expect(clips[0].filePath).toBe('/media/uploaded.mp4');

        // Verify fetch was called correctly
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/media', {
            method: 'POST',
            body: expect.any(Object)
        });

        // Verify FormData was used correctly
        expect(mockFormDataAppend).toHaveBeenCalledWith('file', mockFile);
    });

    it('should handle empty file list when importing', async () => {
        // Call with empty array
        const clips = await client.importMediaFiles([]);

        // Should return empty array
        expect(clips).toHaveLength(0);

        // Fetch should not be called
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should generate thumbnail URLs', () => {
        // Test with a media path
        const thumbnailUrl = client.getThumbnailUrl('/media/test.mp4');

        // Check URL format
        expect(thumbnailUrl).toBe('http://localhost:3001/thumbnails/test.mp4');
    });

    it('should generate media URLs', () => {
        // Test with a media path
        const mediaUrl = client.getMediaUrl('/media/test.mp4');

        // Check URL format
        expect(mediaUrl).toBe('http://localhost:3001/media/test.mp4');
    });

    it('should handle errors when scanning media folder', async () => {
        // Mock a failed response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: 'Server Error'
        });

        // Call the method
        const clips = await client.scanMediaFolder();

        // Should return empty array on error
        expect(clips).toHaveLength(0);

        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/media');
    });

    it('should handle errors when importing media files', async () => {
        // Create a mock File
        const mockFile = new File(['test data'], 'test.mp4', { type: 'video/mp4' });

        // Mock FormData
        global.FormData = jest.fn().mockImplementation(() => ({
            append: jest.fn()
        }));

        // Mock a failed response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: 'Server Error'
        });

        // Call the method
        const clips = await client.importMediaFiles([mockFile]);

        // Should return empty array on error
        expect(clips).toHaveLength(0);

        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/media', {
            method: 'POST',
            body: expect.any(Object)
        });
    });
}); 