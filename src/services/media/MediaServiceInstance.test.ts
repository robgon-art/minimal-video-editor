// We need to unmock the module before importing it
jest.unmock('./MediaServiceInstance');
// Also unmock the client class that the instance uses
jest.unmock('./MediaServiceClient');

// Now import the actual implementation
import { mediaService } from './MediaServiceInstance';

describe('MediaServiceInstance', () => {
    it('should export a configured MediaServiceClient instance', () => {
        // Verify that media service has the expected interface
        expect(mediaService).toBeDefined();
        expect(typeof mediaService.scanMediaFolder).toBe('function');
        expect(typeof mediaService.importMediaFiles).toBe('function');
        expect(typeof mediaService.getThumbnailUrl).toBe('function');
        expect(typeof mediaService.getMediaUrl).toBe('function');
    });

    it('should use the correct API base URL', () => {
        // Test with a known file path
        const mediaUrl = mediaService.getMediaUrl('/media/test.mp4');
        
        // Check that it returns a proper URL
        expect(mediaUrl).toBeDefined();
        
        // URL should contain the correct filename
        expect(mediaUrl).toContain('test.mp4');
        
        // Should start with http://localhost:3001 by default in test environment
        expect(mediaUrl.startsWith('http://')).toBe(true);
        expect(mediaUrl).toContain('localhost');
    });
}); 