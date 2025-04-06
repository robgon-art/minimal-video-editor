import {
  Operation,
  OperationType,
  WriteOperation,
  ReadOperation,
  ListOperation,
  DeleteOperation,
  CreateDirectoryOperation
} from './StorageOperations';
import { MediaMetadata } from '../media/MediaMetadata';
import { StorageAdapter } from '../../infrastructure/io/IOEffects';
import { splitPath } from '../../utils/path/PathUtils';

/**
 * IndexedDB-based implementation of storage adapter
 */
export class IndexedDBStorage implements StorageAdapter {
  private DB_NAME = 'videoEditorFileSystem';
  private DB_VERSION = 1;
  private STORE_NAME = 'files';
  private dbConnection: IDBDatabase | null = null;

  /**
   * Opens the IndexedDB database
   */
  private async openDB(): Promise<IDBDatabase> {
    // If connection exists, return it
    if (this.dbConnection) {
      return this.dbConnection;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject('Error opening IndexedDB');
      };

      request.onsuccess = () => {
        this.dbConnection = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'path' });
        }
      };
    });
  }

  /**
   * Closes the database connection if it's open
   */
  async closeDB(): Promise<boolean> {
    if (this.dbConnection) {
      this.dbConnection.close();
      this.dbConnection = null;
      return true;
    }
    return false;
  }

  /**
   * Execute a storage operation
   */
  async executeOperation(operation: Operation): Promise<any> {
    switch (operation.type) {
      case OperationType.READ:
        return this.read(operation);
      case OperationType.WRITE:
        return this.write(operation as WriteOperation);
      case OperationType.DELETE:
        return this.delete(operation);
      case OperationType.LIST:
        return this.list(operation);
      case OperationType.CREATE_DIRECTORY:
        return this.createDirectory(operation);
      default:
        throw new Error(`Unsupported operation: ${(operation as any).type}`);
    }
  }

  /**
   * Read a file
   */
  private async read(operation: ReadOperation): Promise<{ data: ArrayBuffer; metadata: MediaMetadata }> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(operation.path);

        request.onsuccess = () => {
          if (request.result) {
            resolve({
              data: request.result.data,
              metadata: {
                size: request.result.size,
                lastModified: new Date(request.result.lastModified),
                durationInSeconds: request.result.durationInSeconds
              }
            });
          } else {
            reject(new Error(`File not found: ${operation.path}`));
          }
        };

        request.onerror = () => reject(new Error(`Error reading file: ${operation.path}`));
      });
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  /**
   * Write a file
   */
  private async write(operation: WriteOperation): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const fileData = {
        path: operation.path,
        data: operation.data,
        size: operation.data.byteLength,
        lastModified: new Date().getTime(),
        durationInSeconds: 0 // Will be updated after metadata is extracted
      };

      return new Promise((resolve) => {
        const request = store.put(fileData);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  /**
   * Delete a file
   */
  private async delete(operation: DeleteOperation): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve) => {
        const request = store.delete(operation.path);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * List files in a directory
   */
  private async list(operation: ListOperation): Promise<string[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve) => {
        const files: string[] = [];
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const path = cursor.value.path;
            if (path.startsWith(operation.path)) {
              files.push(path);
            }
            cursor.continue();
          } else {
            resolve(files);
          }
        };

        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error listing directory:', error);
      return [];
    }
  }

  /**
   * Create a directory
   * (This is a no-op for IndexedDB as it doesn't have directories)
   */
  private async createDirectory(operation: CreateDirectoryOperation): Promise<boolean> {
    // Directory concept is virtual in IndexedDB implementation
    return true;
  }

  /**
   * Update metadata for a file
   */
  async updateMetadata(path: string, metadata: Partial<MediaMetadata>): Promise<boolean> {
    try {
      // First read the existing file
      const { data } = await this.read({ type: OperationType.READ, path });

      // Then update with new metadata
      const db = await this.openDB();
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise((resolve) => {
        const getRequest = store.get(path);

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const fileData = getRequest.result;

            // Update metadata properties
            if (metadata.durationInSeconds !== undefined) {
              fileData.durationInSeconds = metadata.durationInSeconds;
            }

            if (metadata.lastModified !== undefined) {
              fileData.lastModified = metadata.lastModified.getTime();
            }

            if (metadata.size !== undefined) {
              fileData.size = metadata.size;
            }

            const putRequest = store.put(fileData);
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };

        getRequest.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error updating metadata:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const fileSystem = new IndexedDBStorage(); 