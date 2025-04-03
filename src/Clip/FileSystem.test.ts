import { MockFileSystem } from './FileSystem';

// Instead of testing the FileSystem integration with real browser APIs,
// we'll test the MockFileSystem implementation which we control
describe('MockFileSystem', () => {
  let mockFileSystem: MockFileSystem;

  beforeEach(() => {
    mockFileSystem = new MockFileSystem();
  });

  describe('readDirectory', () => {
    it('returns files from the specified directory', async () => {
      const files = await mockFileSystem.readDirectory('/media');
      expect(files).toContain('/media/sample1.mp4');
      expect(files).toContain('/media/sample2.mov');
      expect(files).toContain('/media/sample3.avi');
    });

    it('returns empty array for directory with no matching files', async () => {
      const files = await mockFileSystem.readDirectory('/nonexistent');
      expect(files).toEqual([]);
    });
  });

  describe('getFileMetadata', () => {
    it('returns metadata for existing files', async () => {
      const metadata = await mockFileSystem.getFileMetadata('/media/sample1.mp4');
      expect(metadata).toHaveProperty('size');
      expect(metadata).toHaveProperty('lastModified');
      expect(metadata).toHaveProperty('durationInSeconds', 30);
    });

    it('throws error for non-existent files', async () => {
      await expect(
        mockFileSystem.getFileMetadata('/nonexistent/file.mp4')
      ).rejects.toThrow('File not found');
    });
  });

  describe('copyFile', () => {
    it('copies file to new location', async () => {
      const result = await mockFileSystem.copyFile('/media/sample1.mp4', '/newlocation/sample1.mp4');
      expect(result).toBe(true);
      
      // Verify the file exists at the new location
      const metadata = await mockFileSystem.getFileMetadata('/newlocation/sample1.mp4');
      expect(metadata).toHaveProperty('durationInSeconds', 30);
    });

    it('returns false when source file does not exist', async () => {
      const result = await mockFileSystem.copyFile('/nonexistent/file.mp4', '/newlocation/file.mp4');
      expect(result).toBe(false);
    });
  });

  describe('executeOperation', () => {
    it('handles READ_DIRECTORY operations', async () => {
      const files = await mockFileSystem.executeOperation({
        type: 'READ_DIRECTORY',
        directoryPath: '/media'
      });
      expect(files).toContain('/media/sample1.mp4');
    });

    it('handles GET_FILE_METADATA operations', async () => {
      const metadata = await mockFileSystem.executeOperation({
        type: 'GET_FILE_METADATA',
        filePath: '/media/sample1.mp4'
      });
      expect(metadata).toHaveProperty('durationInSeconds', 30);
    });

    it('throws for unsupported operations', async () => {
      await expect(
        mockFileSystem.executeOperation({ type: 'UNSUPPORTED' } as any)
      ).rejects.toThrow('Unsupported operation');
    });
  });
}); 