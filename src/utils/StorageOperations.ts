/**
 * Representation pattern for storage operations
 * This module defines operations as data structures rather than imperatively executing them
 */

// Operation types
export enum OperationType {
    READ = 'READ',
    WRITE = 'WRITE',
    DELETE = 'DELETE',
    LIST = 'LIST',
    CREATE_DIRECTORY = 'CREATE_DIRECTORY'
}

// Base operation interface
export interface StorageOperation {
    type: OperationType;
    path: string;
}

// Read operation
export interface ReadOperation extends StorageOperation {
    type: OperationType.READ;
}

// Write operation
export interface WriteOperation extends StorageOperation {
    type: OperationType.WRITE;
    data: ArrayBuffer;
}

// Delete operation
export interface DeleteOperation extends StorageOperation {
    type: OperationType.DELETE;
}

// List operation
export interface ListOperation extends StorageOperation {
    type: OperationType.LIST;
}

// Create directory operation
export interface CreateDirectoryOperation extends StorageOperation {
    type: OperationType.CREATE_DIRECTORY;
}

// Union type of all operations
export type Operation =
    | ReadOperation
    | WriteOperation
    | DeleteOperation
    | ListOperation
    | CreateDirectoryOperation;

// Operation creators
export const createReadOperation = (path: string): ReadOperation => ({
    type: OperationType.READ,
    path
});

export const createWriteOperation = (path: string, data: ArrayBuffer): WriteOperation => ({
    type: OperationType.WRITE,
    path,
    data
});

export const createDeleteOperation = (path: string): DeleteOperation => ({
    type: OperationType.DELETE,
    path
});

export const createListOperation = (path: string): ListOperation => ({
    type: OperationType.LIST,
    path
});

export const createCreateDirectoryOperation = (path: string): CreateDirectoryOperation => ({
    type: OperationType.CREATE_DIRECTORY,
    path
}); 