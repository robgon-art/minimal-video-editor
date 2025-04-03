/**
 * Side effect executors that process operation representations
 */
import {
    Operation,
    OperationType,
    WriteOperation,
    ReadOperation,
    ListOperation,
    DeleteOperation,
    CreateDirectoryOperation
} from './StorageOperations';
import { MediaMetadata } from './MediaMetadata';

/**
 * Interface for storage adapters that can execute operations
 */
export interface StorageAdapter {
    executeOperation: (operation: Operation) => Promise<any>;
}

/**
 * Extracts video duration from ArrayBuffer data
 */
export const extractVideoDuration = (data: ArrayBuffer): Promise<number> => {
    return new Promise((resolve) => {
        try {
            const blob = new Blob([data]);
            const url = URL.createObjectURL(blob);
            const video = document.createElement('video');

            video.onloadedmetadata = () => {
                const duration = video.duration;
                URL.revokeObjectURL(url);
                resolve(duration);
            };

            // Handle case where metadata can't be loaded
            video.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(0); // Default duration
            };

            video.src = url;
        } catch (error) {
            console.error('Error extracting video duration:', error);
            resolve(0);
        }
    });
};

/**
 * Execute a storage operation using the provided adapter
 */
export const executeOperation = async <T>(
    adapter: StorageAdapter,
    operation: Operation
): Promise<T> => {
    try {
        return await adapter.executeOperation(operation);
    } catch (error) {
        console.error(`Error executing ${operation.type} operation:`, error);
        throw error;
    }
};

/**
 * Execute a write operation with metadata extraction
 */
export const executeWriteWithMetadata = async (
    adapter: StorageAdapter,
    operation: WriteOperation
): Promise<MediaMetadata> => {
    // First extract duration
    const duration = await extractVideoDuration(operation.data);

    // Then execute the write operation
    await executeOperation(adapter, operation);

    // Return metadata object
    return {
        size: operation.data.byteLength,
        lastModified: new Date(),
        durationInSeconds: duration
    };
}; 