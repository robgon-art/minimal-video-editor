import { fileSystem } from './FileSystem';
import { 
  createReadDirectoryOperation, 
  createGetFileMetadataOperation, 
  createClipFromFilePath, 
  isSupportedMediaType 
} from './FileOperations';
import { Clip } from './ClipModel';

// Constants
export const MEDIA_FOLDER_PATH = '/media';

// Function to scan media folder and return clip objects
export const scanMediaFolder = async (): Promise<Clip[]> => {
  try {
    // Create a read directory operation
    const readDirOp = createReadDirectoryOperation(MEDIA_FOLDER_PATH);
    
    // Execute the operation
    const filePaths = await fileSystem.executeOperation(readDirOp);
    
    // Filter to only include supported media types
    const mediaFilePaths = filePaths.filter(isSupportedMediaType);
    
    // Create a list of promises for getting metadata for each file
    const metadataPromises = mediaFilePaths.map(async (filePath: string) => {
      const metadataOp = createGetFileMetadataOperation(filePath);
      const metadata = await fileSystem.executeOperation(metadataOp);
      
      // Extract the filename from the path
      const fileName = filePath.split(/[/\\]/).pop() || '';
      
      // Create a clip object from the file info
      return createClipFromFilePath(
        filePath,
        fileName,
        metadata.durationInSeconds
      );
    });
    
    // Wait for all metadata operations to complete
    return Promise.all(metadataPromises);
  } catch (error) {
    console.error('Error scanning media folder:', error);
    return [];
  }
};

// Function to import media files and return new clips
export const importMediaFiles = async (filePaths: string[]): Promise<Clip[]> => {
  // Filter to only include supported media types
  const supportedFilePaths = filePaths.filter(isSupportedMediaType);
  
  if (supportedFilePaths.length === 0) {
    return [];
  }
  
  try {
    // Copy each file to the media folder
    const copyPromises = supportedFilePaths.map(async (filePath: string) => {
      const fileName = filePath.split(/[/\\]/).pop() || '';
      const destinationPath = `${MEDIA_FOLDER_PATH}/${fileName}`;
      
      // Copy the file
      await fileSystem.copyFile(filePath, destinationPath);
      
      // Get metadata for the file
      const metadata = await fileSystem.getFileMetadata(destinationPath);
      
      // Create a clip object
      return createClipFromFilePath(
        destinationPath,
        fileName,
        metadata.durationInSeconds
      );
    });
    
    // Wait for all copy operations to complete
    return Promise.all(copyPromises);
  } catch (error) {
    console.error('Error importing media files:', error);
    return [];
  }
}; 