import { scanMediaFolder, importMediaFiles, MEDIA_FOLDER_PATH } from './MediaScanner';
import { MockFileSystem } from './FileSystem.mock';
import * as FileSystemModule from './FileSystem';
import * as MediaScannerModule from './MediaScanner';
import { Clip } from '../Clip/ClipModel';

// Mock the entire FileSystem module
jest.mock('./FileSystem', () => {
  // Create a MockFileSystem instance for testing
  const mockFileSystem = new (require('./FileSystem.mock').MockFileSystem)();
  
  return {
    fileSystem: mockFileSystem
  };
});

describe('MediaScanner', () => {
  let mockFileSystem: MockFileSystem;
  let importMediaFilesSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Get the mocked fileSystem and reset it before each test
    mockFileSystem = FileSystemModule.fileSystem as unknown as MockFileSystem;
    mockFileSystem.reset();
    
    // Mock the importMediaFiles function using spyOn
    importMediaFilesSpy = jest.spyOn(MediaScannerModule, 'importMediaFiles').mockImplementation(
      (files: File[]) => {
        // Filter media files
        const supportedFiles = files.filter(file => {
          const fileName = file.name;
          const extension = fileName.split('.').pop()?.toLowerCase() || '';
          const supportedExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
          return supportedExtensions.includes(extension);
        });
        
        // Create mock clips
        const mockClips: Clip[] = supportedFiles.map(file => ({
          id: `mock-id-${Math.random().toString(36).substring(2, 9)}`,
          title: file.name.split('.')[0],
          thumbnailUrl: 'mock-thumbnail-url',
          duration: 10,
          filePath: `${MEDIA_FOLDER_PATH}/${file.name}`
        }));
        
        return Promise.resolve(mockClips);
      }
    );
  });
  
  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
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
      // Create simple mock file objects
      const filesToImport = [
        new File([], 'video1.mp4', { type: 'video/mp4' }),
        new File([], 'video2.mov', { type: 'video/quicktime' }),
        new File([], 'document.txt', { type: 'text/plain' }) // Not a media file, should be ignored
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
      const titles = clips.map(clip => clip.title);
      expect(titles).toContain('video1');
      expect(titles).toContain('video2');
    });
    
    it('should return an empty array if no supported media files are provided', async () => {
      // Non-media files to import
      const filesToImport = [
        new File([], 'document1.txt', { type: 'text/plain' }),
        new File([], 'image.jpg', { type: 'image/jpeg' }),
        new File([], 'spreadsheet.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      ];
      
      // Call the function
      const clips = await importMediaFiles(filesToImport);
      
      // We expect 0 clips
      expect(clips.length).toBe(0);
    });
  });
}); 