import {
  createCopyFileOperation,
  createReadDirectoryOperation,
  createGetFileMetadataOperation,
  createImportFilesOperations,
  getFileExtension,
  isSupportedMediaType
} from './FileOperations';
import { createClipFromFile } from '../../Clip/ClipModel';

describe('FileOperations', () => {
  describe('createCopyFileOperation', () => {
    it('should create a copy file operation object', () => {
      const sourcePath = '/path/to/source.mp4';
      const destinationPath = '/path/to/destination.mp4';

      const result = createCopyFileOperation(sourcePath, destinationPath);

      expect(result).toEqual({
        type: 'COPY_FILE',
        sourcePath,
        destinationPath
      });
    });
  });

  describe('createReadDirectoryOperation', () => {
    it('should create a read directory operation object', () => {
      const directoryPath = '/path/to/directory';

      const result = createReadDirectoryOperation(directoryPath);

      expect(result).toEqual({
        type: 'READ_DIRECTORY',
        directoryPath
      });
    });
  });

  describe('createGetFileMetadataOperation', () => {
    it('should create a get file metadata operation object', () => {
      const filePath = '/path/to/file.mp4';

      const result = createGetFileMetadataOperation(filePath);

      expect(result).toEqual({
        type: 'GET_FILE_METADATA',
        filePath
      });
    });
  });

  describe('createImportFilesOperations', () => {
    it('should create operations for importing multiple files', () => {
      const filePaths = [
        '/path/to/file1.mp4',
        '/path/to/file2.mov'
      ];
      const destinationFolder = '/media';

      const result = createImportFilesOperations(filePaths, destinationFolder);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: 'COPY_FILE',
        sourcePath: '/path/to/file1.mp4',
        destinationPath: '/media/file1.mp4'
      });
      expect(result[1]).toEqual({
        type: 'COPY_FILE',
        sourcePath: '/path/to/file2.mov',
        destinationPath: '/media/file2.mov'
      });
    });
  });

  describe('createClipFromFile', () => {
    it('should create a clip object from file data', () => {
      const filePath = '/media/sample.mp4';
      const fileName = 'sample.mp4';
      const durationInSeconds = 30;

      const result = createClipFromFile(filePath, fileName, durationInSeconds);

      expect(result.id).toBeDefined(); // UUID should be generated
      expect(result.title).toBe('sample'); // Should remove extension
      expect(result.thumbnailUrl).toBe('/video_clip.png');
      expect(result.duration).toBe(30);
      expect(result.filePath).toBe('/media/sample.mp4');
    });
  });

  describe('getFileExtension', () => {
    it('should extract the file extension from a path', () => {
      expect(getFileExtension('/path/to/file.mp4')).toBe('mp4');
      expect(getFileExtension('file.MOV')).toBe('mov'); // Should be lowercase
      expect(getFileExtension('file.with.multiple.dots.avi')).toBe('avi');
      expect(getFileExtension('file_without_extension')).toBe('');
    });
  });

  describe('isSupportedMediaType', () => {
    it('should return true for supported media types', () => {
      expect(isSupportedMediaType('/path/to/file.mp4')).toBe(true);
      expect(isSupportedMediaType('/path/to/file.mov')).toBe(true);
      expect(isSupportedMediaType('file.avi')).toBe(true);
      expect(isSupportedMediaType('file.webm')).toBe(true);
      expect(isSupportedMediaType('file.mkv')).toBe(true);
    });

    it('should return false for unsupported media types', () => {
      expect(isSupportedMediaType('/path/to/file.txt')).toBe(false);
      expect(isSupportedMediaType('/path/to/file.jpg')).toBe(false);
      expect(isSupportedMediaType('file.png')).toBe(false);
      expect(isSupportedMediaType('file_without_extension')).toBe(false);
    });
  });
}); 