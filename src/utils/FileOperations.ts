import { Clip, createClipFromFile } from '../Clip/ClipModel';

// Types for file operations
export type FileOperation =
  | { type: 'COPY_FILE'; sourcePath: string; destinationPath: string }
  | { type: 'READ_DIRECTORY'; directoryPath: string }
  | { type: 'GET_FILE_METADATA'; filePath: string }
  | { type: 'WRITE_FILE'; filePath: string; data: ArrayBuffer }
  | { type: 'CREATE_DIRECTORY'; directoryPath: string };

// Factory functions for file operations
export const createCopyFileOperation = (sourcePath: string, destinationPath: string): FileOperation => ({
  type: 'COPY_FILE',
  sourcePath,
  destinationPath
});

export const createReadDirectoryOperation = (directoryPath: string): FileOperation => ({
  type: 'READ_DIRECTORY',
  directoryPath
});

export const createGetFileMetadataOperation = (filePath: string): FileOperation => ({
  type: 'GET_FILE_METADATA',
  filePath
});

export const createWriteFileOperation = (filePath: string, data: ArrayBuffer): FileOperation => ({
  type: 'WRITE_FILE',
  filePath,
  data
});

export const createCreateDirectoryOperation = (directoryPath: string): FileOperation => ({
  type: 'CREATE_DIRECTORY',
  directoryPath
});

// Function that creates operations for importing files - pure
export const createImportFilesOperations = (
  filePaths: string[],
  destinationFolder: string
): FileOperation[] => {
  return filePaths.map(filePath => {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const destinationPath = `${destinationFolder}/${fileName}`;

    return createCopyFileOperation(filePath, destinationPath);
  });
};

// Helper function to extract file extension - pure
export const getFileExtension = (filePath: string): string => {
  const match = filePath.match(/\.([^/.]+)$/);
  return match ? match[1].toLowerCase() : '';
};

// Helper function to check if a file is a supported media type - pure
export const isSupportedMediaType = (filePath: string): boolean => {
  const supportedExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  const extension = getFileExtension(filePath);
  return supportedExtensions.includes(extension);
}; 