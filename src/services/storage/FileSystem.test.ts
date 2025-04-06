import { IndexedDBStorage, fileSystem } from './FileSystem';
import { MockStorageAdapter } from '../../infrastructure/fileSystem/FileSystem.mock';
import { MediaMetadata } from '../media/MediaMetadata';

// Add structuredClone polyfill if it doesn't exist
if (typeof structuredClone !== 'function') {
  // @ts-ignore - Adding global polyfill
  global.structuredClone = (obj: any) => {
    // Special handling for ArrayBuffer
    if (obj instanceof ArrayBuffer) {
      const buffer = new ArrayBuffer(obj.byteLength);
      new Uint8Array(buffer).set(new Uint8Array(obj));
      return buffer;
    }

    // For objects containing ArrayBuffers, need custom handling
    if (obj && typeof obj === 'object') {
      const clone = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // @ts-ignore
          clone[key] = global.structuredClone(obj[key]);
        }
      }
      return clone;
    }

    // For simple values
    return obj;
  };
}

import {
  Operation,
  OperationType,
  WriteOperation,
  ReadOperation,
  ListOperation,
  DeleteOperation,
  CreateDirectoryOperation
} from './StorageOperations';

// Setup fake IndexedDB environment
import 'fake-indexeddb/auto';

describe('IndexedDBStorage', () => {
  let storage: IndexedDBStorage;

  beforeEach(() => {
    // Create a fresh instance for each test
    storage = new IndexedDBStorage();

    // Clear IndexedDB between tests
    indexedDB.deleteDatabase('videoEditorFileSystem');
  });

  afterEach(async () => {
    // Close database connection after each test
    await storage.closeDB();
  });

  afterAll(async () => {
    // Close any remaining database connections and delete the test database
    await storage.closeDB();
    indexedDB.deleteDatabase('videoEditorFileSystem');
  });

  describe('Basic CRUD operations', () => {
    it('should write and read a file successfully', async () => {
      // Arrange
      const testData = new ArrayBuffer(100);
      const path = '/test/file.mp4';

      // Act - Write
      const writeOp: WriteOperation = {
        type: OperationType.WRITE,
        path,
        data: testData
      };

      const writeResult = await storage.executeOperation(writeOp);

      // Act - Read
      const readOp: ReadOperation = {
        type: OperationType.READ,
        path
      };

      const readResult = await storage.executeOperation(readOp);

      // Assert
      expect(writeResult).toBe(true);
      expect(readResult.data).toEqual(testData);
      expect(readResult.metadata).toBeDefined();
      expect(readResult.metadata.size).toBe(testData.byteLength);
    });

    it('should delete a file successfully', async () => {
      // Arrange
      const testData = new ArrayBuffer(100);
      const path = '/test/file-to-delete.mp4';

      // Write first
      const writeOp: WriteOperation = {
        type: OperationType.WRITE,
        path,
        data: testData
      };

      await storage.executeOperation(writeOp);

      // Act - Delete
      const deleteOp: DeleteOperation = {
        type: OperationType.DELETE,
        path
      };

      const deleteResult = await storage.executeOperation(deleteOp);

      // Assert
      expect(deleteResult).toBe(true);

      // Verify deletion by attempting to read
      const readOp: ReadOperation = {
        type: OperationType.READ,
        path
      };

      await expect(storage.executeOperation(readOp)).rejects.toThrow();
    });

    it('should list files in a directory', async () => {
      // Arrange
      const testData = new ArrayBuffer(100);
      const basePath = '/test-list';
      const filePaths = [
        `${basePath}/file1.mp4`,
        `${basePath}/file2.mp4`,
        `${basePath}/subdirectory/file3.mp4`,
        '/other-directory/file4.mp4'
      ];

      // Write all files
      for (const path of filePaths) {
        const writeOp: WriteOperation = {
          type: OperationType.WRITE,
          path,
          data: testData
        };
        await storage.executeOperation(writeOp);
      }

      // Act - List
      const listOp: ListOperation = {
        type: OperationType.LIST,
        path: basePath
      };

      const files = await storage.executeOperation(listOp);

      // Assert
      expect(files).toHaveLength(3); // Should not include the one in other-directory
      expect(files).toContain(filePaths[0]);
      expect(files).toContain(filePaths[1]);
      expect(files).toContain(filePaths[2]);
      expect(files).not.toContain(filePaths[3]);
    });

    it('should create directory (virtual operation)', async () => {
      // Act
      const createDirOp: CreateDirectoryOperation = {
        type: OperationType.CREATE_DIRECTORY,
        path: '/virtual-dir'
      };

      const result = await storage.executeOperation(createDirOp);

      // Assert - should always succeed in IndexedDB implementation
      expect(result).toBe(true);
    });
  });

  describe('Metadata operations', () => {
    it('should update metadata for an existing file', async () => {
      // Arrange
      const testData = new ArrayBuffer(100);
      const path = '/test/metadata-file.mp4';

      // Write first
      const writeOp: WriteOperation = {
        type: OperationType.WRITE,
        path,
        data: testData
      };

      await storage.executeOperation(writeOp);

      // Act - Update metadata
      const newMetadata: Partial<MediaMetadata> = {
        durationInSeconds: 120,
        size: 1024
      };

      const updateResult = await storage.updateMetadata(path, newMetadata);

      // Read back
      const readOp: ReadOperation = {
        type: OperationType.READ,
        path
      };

      const readResult = await storage.executeOperation(readOp);

      // Assert
      expect(updateResult).toBe(true);
      expect(readResult.metadata.durationInSeconds).toBe(newMetadata.durationInSeconds);
      expect(readResult.metadata.size).toBe(newMetadata.size);
    });

    it('should fail to update metadata for non-existent file', async () => {
      // Temporarily silence console.error for this test
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        // Act
        const nonExistentPath = '/test/non-existent-file.mp4';
        const updateResult = await storage.updateMetadata(nonExistentPath, {
          durationInSeconds: 60
        });

        // Assert
        expect(updateResult).toBe(false);
      } finally {
        // Restore console.error
        console.error = originalConsoleError;
      }
    });
  });

  describe('Error handling', () => {
    it('should handle read error for non-existent file', async () => {
      // Arrange
      const readOp: ReadOperation = {
        type: OperationType.READ,
        path: '/non-existent.mp4'
      };

      // Act & Assert
      await expect(storage.executeOperation(readOp)).rejects.toThrow();
    });

    it('should return empty array when listing non-existent directory', async () => {
      // Arrange
      const listOp: ListOperation = {
        type: OperationType.LIST,
        path: '/non-existent-dir'
      };

      // Act
      const result = await storage.executeOperation(listOp);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error for unsupported operation type', async () => {
      // Arrange
      const invalidOp = {
        type: 'INVALID_TYPE'
      } as unknown as Operation;

      // Act & Assert
      await expect(storage.executeOperation(invalidOp)).rejects.toThrow();
    });
  });

  describe('Database connection management', () => {
    it('should close database connection successfully', async () => {
      // Arrange - Perform an operation to ensure DB is open
      const testData = new ArrayBuffer(100);
      const path = '/test/connection-test.mp4';
      const writeOp: WriteOperation = {
        type: OperationType.WRITE,
        path,
        data: testData
      };
      await storage.executeOperation(writeOp);
      
      // Act
      const result = await storage.closeDB();
      
      // Assert
      expect(result).toBe(true);
      
      // Attempt to close again - should return false as connection is already closed
      const secondCloseResult = await storage.closeDB();
      expect(secondCloseResult).toBe(false);
    });
    
    it('should reconnect after database is closed', async () => {
      // Arrange
      const testData = new ArrayBuffer(100);
      const path = '/test/reconnect-test.mp4';
      
      // Write data
      const writeOp: WriteOperation = {
        type: OperationType.WRITE,
        path,
        data: testData
      };
      await storage.executeOperation(writeOp);
      
      // Close connection
      await storage.closeDB();
      
      // Act - Should reopen connection automatically
      const readOp: ReadOperation = {
        type: OperationType.READ,
        path
      };
      const readResult = await storage.executeOperation(readOp);
      
      // Assert
      expect(readResult.data).toEqual(testData);
    });
  });

  describe('Integration with MockStorageAdapter', () => {
    let mockStorage: MockStorageAdapter;

    beforeEach(() => {
      mockStorage = new MockStorageAdapter();
    });

    it('should have compatible interfaces allowing interchangeable use', async () => {
      // This test verifies that both implementations work the same way
      const testData = new ArrayBuffer(100);
      const path = '/test/compatibility-test.mp4';

      // Create identical write operations
      const writeOp: WriteOperation = {
        type: OperationType.WRITE,
        path,
        data: testData
      };

      // Execute on both implementations
      const indexedDBResult = await storage.executeOperation(writeOp);
      const mockResult = await mockStorage.executeOperation(writeOp);

      // Both should succeed
      expect(indexedDBResult).toBe(true);
      expect(mockResult).toBe(true);

      // Create read operations
      const readOp: ReadOperation = {
        type: OperationType.READ,
        path
      };

      // Read from both implementations
      const indexedDBReadResult = await storage.executeOperation(readOp);
      const mockReadResult = await mockStorage.executeOperation(readOp);

      // Both should return data with metadata
      expect(indexedDBReadResult.data).toEqual(testData);
      expect(mockReadResult.data).toEqual(testData);

      // Both should have metadata structure (actual values may differ)
      expect(indexedDBReadResult.metadata).toBeDefined();
      expect(mockReadResult.metadata).toBeDefined();
    });
  });
});