import { fileSystem } from './FileSystem';
import { 
  createReadDirectoryOperation, 
  createGetFileMetadataOperation, 
  createClipFromFilePath, 
  isSupportedMediaType 
} from './FileOperations';
import { Clip } from '../Clip/ClipModel';

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
export const importMediaFiles = async (files: File[]): Promise<Clip[]> => {
  // Filter to only include supported media types
  const supportedFiles = files.filter(file => {
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const supportedExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    return supportedExtensions.includes(extension);
  });
  
  if (supportedFiles.length === 0) {
    return [];
  }
  
  try {
    // Process each file
    const clipPromises = supportedFiles.map(async (file: File) => {
      const fileName = file.name;
      const destinationPath = `${MEDIA_FOLDER_PATH}/${fileName}`;
      
      // Save the file to the media folder
      await saveFileToMediaFolder(file, destinationPath);
      
      // Create a temporary video element to get duration
      const duration = await getVideoDuration(file);
      
      // Create a clip object
      return createClipFromFilePath(
        destinationPath,
        fileName,
        duration
      );
    });
    
    // Wait for all operations to complete
    return Promise.all(clipPromises);
  } catch (error) {
    console.error('Error importing media files:', error);
    return [];
  }
};

// Helper function to save a File object to media folder
const saveFileToMediaFolder = async (file: File, destinationPath: string): Promise<void> => {
  try {
    // Create a directory if it doesn't exist
    await ensureMediaDirectoryExists();
    
    // Write the file to the media folder
    const arrayBuffer = await file.arrayBuffer();
    await fileSystem.writeFile(destinationPath, arrayBuffer);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Helper function to ensure the media directory exists
const ensureMediaDirectoryExists = async (): Promise<void> => {
  try {
    await fileSystem.createDirectory(MEDIA_FOLDER_PATH);
  } catch (error) {
    // Directory might already exist, which is fine
    console.log('Media directory check:', error);
  }
};

// Helper function to get video duration using a video element
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.src = URL.createObjectURL(file);
  });
}; 