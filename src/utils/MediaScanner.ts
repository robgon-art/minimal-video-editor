import { fileSystem } from './FileSystem';
import { SUPPORTED_EXTENSIONS, MediaMetadata } from './MediaMetadata';
import {
    createListOperation,
    createReadOperation,
    createWriteOperation,
    createCreateDirectoryOperation,
    OperationType
} from './StorageOperations';
import {
    executeOperation,
    executeWriteWithMetadata
} from './IOEffects';
import {
    fileToClip,
    filterSupportedFiles,
    mapPathsToClips
} from './MediaTransforms';
import { getFileExtension } from './PathUtils';
import { Clip } from '../Clip/ClipModel';

// Constants
export const MEDIA_FOLDER_PATH = '/media';

// Function to scan media folder and return clip objects
export const scanMediaFolder = async (): Promise<Clip[]> => {
    try {
        // Create a list operation
        const listOperation = createListOperation(MEDIA_FOLDER_PATH);

        // Execute the operation to get all paths
        const filePaths = await executeOperation<string[]>(fileSystem, listOperation);

        // Filter to only include supported media types
        const mediaFilePaths = filePaths.filter((path: string) => {
            const extension = getFileExtension(path);
            return SUPPORTED_EXTENSIONS.includes(extension);
        });

        // Map file paths to clips with metadata
        return mapPathsToClips(
            mediaFilePaths,
            async (path: string) => {
                // Create read operation
                const readOperation = createReadOperation(path);
                // Execute to get metadata
                const result = await executeOperation<{ metadata: MediaMetadata }>(fileSystem, readOperation);
                return result.metadata;
            }
        );
    } catch (error) {
        console.error('Error scanning media folder:', error);
        return [];
    }
};

// Function to import media files and return new clips
export const importMediaFiles = async (files: File[]): Promise<Clip[]> => {
    // Filter to only include supported media types
    const supportedFiles = filterSupportedFiles(files, SUPPORTED_EXTENSIONS);

    if (supportedFiles.length === 0) {
        return [];
    }

    try {
        // Ensure media directory exists
        await ensureMediaDirectoryExists();

        // Process each file
        const clipPromises = supportedFiles.map(async (file: File) => {
            const fileName = file.name;
            const destinationPath = `${MEDIA_FOLDER_PATH}/${fileName}`;

            // Get file data
            const arrayBuffer = await file.arrayBuffer();

            // Create write operation
            const writeOperation = createWriteOperation(destinationPath, arrayBuffer);

            // Execute write with metadata extraction
            const metadata = await executeWriteWithMetadata(fileSystem, writeOperation);

            // Create a clip object
            return fileToClip(
                destinationPath,
                fileName,
                metadata.durationInSeconds
            );
        });

        // Wait for all operations to complete
        return Promise.all(clipPromises);
    } catch (error) {
        console.error('Error importing media files:', error);
        return [];
    }
};

// Helper function to ensure the media directory exists
const ensureMediaDirectoryExists = async (): Promise<void> => {
    try {
        const createDirOperation = createCreateDirectoryOperation(MEDIA_FOLDER_PATH);
        await executeOperation<boolean>(fileSystem, createDirOperation);
    } catch (error) {
        // Directory might already exist, which is fine
        console.log('Media directory check:', error);
    }
}; 