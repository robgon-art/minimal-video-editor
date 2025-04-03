import { scanMediaFolder, importMediaFiles, MEDIA_FOLDER_PATH } from './MediaScanner';
import { MockFileSystem } from './FileSystem.mock';
import * as FileSystemModule from './FileSystem';

// Mock the fileSystem module
jest.mock('./FileSystem', () => {
  // Create a MockFileSystem instance for testing
  const mockFileSystem = new (require('./FileSystem.mock').MockFileSystem)();
  
  return {
    fileSystem: mockFileSystem
  };
});

describe('MediaScanner', () => {
  let mockFileSystem: MockFileSystem;
  
  beforeEach(() => {
    // Get the mocked fileSystem and reset it before each test
    mockFileSystem = FileSystemModule.fileSystem as unknown as MockFileSystem;
    mockFileSystem.reset();
  });
  
  describe('scanMediaFolder', () => {
    it('should scan the media folder and return clip objects', async () => {
      // Call the function
      const clips = await scanMediaFolder();
      
      // We expect 3 clips (not including document.txt which is not a media file)
      expect(clips.length).toBe(3);
      
      // Verify the clips have the expected properties
      clips.forEach(clip => {
        expect(clip.id).toBeDefined();
        expect(clip.title).toBeDefined();
        expect(clip.thumbnailUrl).toBeDefined();
        expect(typeof clip.duration).toBe('number');
        expect(clip.filePath).toContain('/media/');
      });
      
      // Check that we have the expected media files
      const titles = clips.map(clip => clip.title);
      expect(titles).toContain('sample1');
      expect(titles).toContain('sample2');
      expect(titles).toContain('sample3');
    });
  });
  
  describe('importMediaFiles', () => {
    it('should import media files and return clip objects', async () => {
      // Files to import
      const filesToImport = [
        '/source/video1.mp4',
        '/source/video2.mov',
        '/source/document.txt' // Not a media file, should be ignored
      ];
      
      // Call the function
      const clips = await importMediaFiles(filesToImport);
      
      // We expect 2 clips (not including document.txt)
      expect(clips.length).toBe(2);
      
      // Verify the clips have the expected properties
      clips.forEach(clip => {
        expect(clip.id).toBeDefined();
        expect(clip.title).toBeDefined();
        expect(clip.thumbnailUrl).toBeDefined();
        expect(typeof clip.duration).toBe('number');
        expect(clip.filePath).toContain(MEDIA_FOLDER_PATH);
      });
      
      // Check that we have the expected media files
      const filePaths = clips.map(clip => clip.filePath);
      expect(filePaths).toContain(`${MEDIA_FOLDER_PATH}/video1.mp4`);
      expect(filePaths).toContain(`${MEDIA_FOLDER_PATH}/video2.mov`);
    });
    
    it('should return an empty array if no supported media files are provided', async () => {
      // Non-media files to import
      const filesToImport = [
        '/source/document1.txt',
        '/source/image.jpg',
        '/source/spreadsheet.xlsx'
      ];
      
      // Call the function
      const clips = await importMediaFiles(filesToImport);
      
      // We expect 0 clips
      expect(clips.length).toBe(0);
    });
  });
}); 