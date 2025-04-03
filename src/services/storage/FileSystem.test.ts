import { mockFileSystem } from '../../infrastructure/fileSystem/FileSystem.mock';
import {
  createListOperation,
  createReadOperation,
  OperationType
} from './StorageOperations';

// Test the mock storage adapter implementation
describe('MockStorageAdapter', () => {
  beforeEach(() => {
    // Reset the mock if needed
  });

  describe('LIST operations', () => {
    it('returns files from the specified directory', async () => {
      const listOperation = createListOperation('/media');
      const files = await mockFileSystem.executeOperation(listOperation);

      expect(files).toContain('/media/sample1.mp4');
      expect(files).toContain('/media/sample2.mov');
      expect(files).toContain('/media/sample3.avi');
    });

    it('returns empty array for directory with no matching files', async () => {
      const listOperation = createListOperation('/nonexistent');
      const files = await mockFileSystem.executeOperation(listOperation);

      expect(files).toEqual([]);
    });
  });

  describe('READ operations', () => {
    it('returns data and metadata for existing files', async () => {
      const readOperation = createReadOperation('/media/sample1.mp4');
      const result = await mockFileSystem.executeOperation(readOperation);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('size');
      expect(result.metadata).toHaveProperty('lastModified');
      expect(result.metadata).toHaveProperty('durationInSeconds', 30);
    });

    it('throws error for non-existent files', async () => {
      const readOperation = createReadOperation('/nonexistent/file.mp4');

      await expect(
        mockFileSystem.executeOperation(readOperation)
      ).rejects.toThrow('File not found');
    });
  });

  describe('WRITE operations', () => {
    it('writes file data and returns true', async () => {
      const writeOperation = {
        type: OperationType.WRITE,
        path: '/test/newfile.mp4',
        data: new ArrayBuffer(10)
      };

      const result = await mockFileSystem.executeOperation(writeOperation);
      expect(result).toBe(true);

      // Verify the file exists at the new location
      const readOperation = createReadOperation('/test/newfile.mp4');
      const fileData = await mockFileSystem.executeOperation(readOperation);
      expect(fileData).toHaveProperty('metadata.durationInSeconds', 30);
    });
  });

  describe('unsupported operations', () => {
    it('throws for unsupported operations', async () => {
      await expect(
        mockFileSystem.executeOperation({ type: 'UNSUPPORTED' } as any)
      ).rejects.toThrow('Unsupported operation');
    });
  });
}); 