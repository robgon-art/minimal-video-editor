import { v4 as uuidv4 } from 'uuid';
import { Clip } from './ClipModel';

// Types for file operations
export type FileOperation = 
  | { type: 'COPY_FILE'; sourcePath: string; destinationPath: string }
  | { type: 'READ_DIRECTORY'; directoryPath: string }
  | { type: 'GET_FILE_METADATA'; filePath: string };

// Function to create file operation objects - pure
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

// Pure function to create a clip object from file metadata
export const createClipFromFilePath = (
  filePath: string, 
  fileName: string, 
  durationInSeconds: number
): Clip => {
  return {
    id: uuidv4(),
    title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
    thumbnailUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(fileName)}`,
    duration: durationInSeconds,
    filePath: filePath
  };
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