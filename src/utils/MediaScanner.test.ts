import { scanMediaFolder, importMediaFiles, MEDIA_FOLDER_PATH } from '../utils/MediaScanner';
import { Operation, OperationType } from '../utils/StorageOperations';
import { MediaMetadata } from './MediaMetadata';

// Mock the modules
jest.mock('./FileSystem');
jest.mock('./IOEffects');
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

// Import the mocked modules
import { fileSystem } from './FileSystem';
import { executeOperation, executeWriteWithMetadata } from './IOEffects';

describe('MediaScanner', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanMediaFolder', () => {
    it('should return clips for media files in the media folder', async () => {
      // Setup the mock for executeOperation
      (executeOperation as jest.Mock).mockImplementation((adapter, operation) => {
        if (operation.type === 'LIST') {
          return Promise.resolve([
            '/media/sample1.mp4',
            '/media/sample2.mov',
            '/media/sample3.avi',
            '/media/document.txt'
          ]);
        } else if (operation.type === 'READ') {
          return Promise.resolve({
            metadata: {
              size: 1024,
              lastModified: new Date(),
              durationInSeconds: 60
            }
          });
        }
        return Promise.resolve(null);
      });

      const clips = await scanMediaFolder();

      // Should return 3 clips (for video files only)
      expect(clips.length).toBe(3);

      // First clip should have these properties
      expect(clips[0].id).toBe('mock-uuid');
      expect(clips[0].filePath).toBe('/media/sample1.mp4');
      expect(clips[0].duration).toBe(60);
    });

    it('should return empty array if no media files found', async () => {
      // Mock to return empty array
      (executeOperation as jest.Mock).mockImplementation((adapter, operation) => {
        if (operation.type === 'LIST') {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });

      const clips = await scanMediaFolder();

      expect(clips).toEqual([]);
      expect(clips.length).toBe(0);
    });

    it('should return empty array on error', async () => {
      // Temporarily mock console.error to suppress output in tests
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Mock to throw an error on LIST operation
      (executeOperation as jest.Mock).mockImplementation((adapter, operation) => {
        if (operation.type === 'LIST') {
          return Promise.reject(new Error('Test error'));
        }
        return Promise.resolve(null);
      });

      const clips = await scanMediaFolder();

      // Verify behavior
      expect(clips).toEqual([]);
      
      // Restore original console.error
      console.error = originalConsoleError;
    });
  });

  describe('importMediaFiles', () => {
    it('should import media files and return clips', async () => {
      // Setup the mock for directory creation
      (executeOperation as jest.Mock).mockImplementation((adapter, operation) => {
        if (operation.type === 'CREATE_DIRECTORY') {
          return Promise.resolve(true);
        }
        return Promise.resolve(null);
      });

      // Setup the mock for metadata extraction
      (executeWriteWithMetadata as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          size: 1024,
          lastModified: new Date(),
          durationInSeconds: 60
        });
      });

      // Create test files
      const testFiles = [
        new File(['test data'], 'video1.mp4', { type: 'video/mp4' }),
        new File(['test data'], 'video2.mov', { type: 'video/quicktime' }),
        new File(['test data'], 'document.txt', { type: 'text/plain' }) // Should be filtered out
      ];

      // Mock File.prototype.arrayBuffer
      const originalArrayBuffer = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10));

      const clips = await importMediaFiles(testFiles);

      // Should return 2 clips (for video files only)
      expect(clips.length).toBe(2);

      // Restore mocks
      File.prototype.arrayBuffer = originalArrayBuffer;
    });

    it('should return empty array if no supported files', async () => {
      // Create test files with no supported types
      const testFiles = [
        new File(['test data'], 'document1.txt', { type: 'text/plain' }),
        new File(['test data'], 'document2.pdf', { type: 'application/pdf' })
      ];

      const clips = await importMediaFiles(testFiles);

      expect(clips).toEqual([]);
      expect(clips.length).toBe(0);
    });
  });
}); 