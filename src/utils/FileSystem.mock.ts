/**
 * Mock implementation of storage adapter for testing
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
import { StorageAdapter } from './IOEffects';

/**
 * Mock implementation of storage adapter for testing
 */
export class MockStorageAdapter implements StorageAdapter {
  /**
   * In-memory storage for files
   */
  private mockFiles: Map<string, {
    data: ArrayBuffer;
    metadata: MediaMetadata;
  }> = new Map();
  
  /**
   * Constructor to initialize with sample files
   */
  constructor() {
    // Add some sample files
    const dummyData = new ArrayBuffer(100);
    
    this.mockFiles.set('/media/sample1.mp4', {
      data: dummyData,
      metadata: {
        size: 1024,
        lastModified: new Date(),
        durationInSeconds: 30 
      }
    });
    
    this.mockFiles.set('/media/sample2.mov', {
      data: dummyData,
      metadata: {
        size: 2048,
        lastModified: new Date(),
        durationInSeconds: 45
      }
    });
    
    this.mockFiles.set('/media/sample3.avi', {
      data: dummyData,
      metadata: {
        size: 3072,
        lastModified: new Date(),
        durationInSeconds: 60
      }
    });
  }
  
  /**
   * Execute operation
   */
  async executeOperation(operation: Operation): Promise<any> {
    switch (operation.type) {
      case OperationType.READ:
        return this.read(operation as ReadOperation);
      case OperationType.WRITE:
        return this.write(operation as WriteOperation);
      case OperationType.DELETE:
        return this.delete(operation as DeleteOperation);
      case OperationType.LIST:
        return this.list(operation as ListOperation);
      case OperationType.CREATE_DIRECTORY:
        return this.createDirectory(operation as CreateDirectoryOperation);
      default:
        throw new Error(`Unsupported operation: ${(operation as any).type}`);
    }
  }
  
  /**
   * Read a file
   */
  private async read(operation: ReadOperation): Promise<{ data: ArrayBuffer; metadata: MediaMetadata }> {
    const file = this.mockFiles.get(operation.path);
    
    if (!file) {
      throw new Error(`File not found: ${operation.path}`);
    }
    
    return {
      data: file.data,
      metadata: file.metadata
    };
  }
  
  /**
   * Write a file
   */
  private async write(operation: WriteOperation): Promise<boolean> {
    try {
      this.mockFiles.set(operation.path, {
        data: operation.data,
        metadata: {
          size: operation.data.byteLength,
          lastModified: new Date(),
          durationInSeconds: 30 // Mock duration
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }
  
  /**
   * Delete a file
   */
  private async delete(operation: DeleteOperation): Promise<boolean> {
    return this.mockFiles.delete(operation.path);
  }
  
  /**
   * List files in a directory
   */
  private async list(operation: ListOperation): Promise<string[]> {
    return Array.from(this.mockFiles.keys())
      .filter(path => path.startsWith(operation.path));
  }
  
  /**
   * Create directory 
   * (This is a no-op for mock system as it doesn't have directories)
   */
  private async createDirectory(operation: CreateDirectoryOperation): Promise<boolean> {
    return true;
  }
  
  /**
   * Update metadata for testing
   */
  async updateMetadata(path: string, metadata: Partial<MediaMetadata>): Promise<boolean> {
    const file = this.mockFiles.get(path);
    
    if (!file) {
      return false;
    }
    
    // Update metadata properties
    if (metadata.durationInSeconds !== undefined) {
      file.metadata.durationInSeconds = metadata.durationInSeconds;
    }
    
    if (metadata.lastModified !== undefined) {
      file.metadata.lastModified = metadata.lastModified;
    }
    
    if (metadata.size !== undefined) {
      file.metadata.size = metadata.size;
    }
    
    this.mockFiles.set(path, file);
    return true;
  }
}

// Export a singleton instance for testing
export const mockFileSystem = new MockStorageAdapter(); 