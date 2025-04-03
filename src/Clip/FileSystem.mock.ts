import { IFileSystem } from './FileSystem';
import { FileOperation } from './FileOperations';

// In-memory mock implementation of FileSystem
export class MockFileSystem implements IFileSystem {
  private fileStore: Map<string, string> = new Map();
  private metadata: Map<string, any> = new Map();
  
  // Mock data to return
  private mockFiles: string[] = [
    '/media/sample1.mp4',
    '/media/sample2.mov', 
    '/media/sample3.avi',
    '/media/document.txt' // Not a media file
  ];
  
  constructor() {
    // Initialize with some mock data
    this.mockFiles.forEach(path => {
      this.fileStore.set(path, `Mock content for ${path}`);
      
      // Generate mock metadata
      const fileName = path.split(/[/\\]/).pop() || '';
      const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      this.metadata.set(path, {
        size: hash * 1000,
        lastModified: new Date(),
        durationInSeconds: 10 + (hash % 50) // 10-60 seconds
      });
    });
  }
  
  async executeOperation(operation: FileOperation): Promise<any> {
    switch (operation.type) {
      case 'COPY_FILE':
        return this.copyFile(operation.sourcePath, operation.destinationPath);
      case 'READ_DIRECTORY':
        return this.readDirectory(operation.directoryPath);
      case 'GET_FILE_METADATA':
        return this.getFileMetadata(operation.filePath);
      default:
        throw new Error(`Unsupported operation: ${(operation as any).type}`);
    }
  }
  
  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    // Simulate copying a file by creating an entry in the fileStore
    const content = `Mock content for ${sourcePath}`;
    this.fileStore.set(destinationPath, content);
    
    // Also create metadata for the new file
    const fileName = destinationPath.split(/[/\\]/).pop() || '';
    const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    this.metadata.set(destinationPath, {
      size: hash * 1000,
      lastModified: new Date(),
      durationInSeconds: 10 + (hash % 50) // 10-60 seconds
    });
    
    return true;
  }
  
  async readDirectory(directoryPath: string): Promise<string[]> {
    // Return files that start with the directoryPath
    return this.mockFiles.filter(path => path.startsWith(directoryPath));
  }
  
  async getFileMetadata(filePath: string): Promise<{ 
    size: number; 
    lastModified: Date;
    durationInSeconds: number; 
  }> {
    // Return mock metadata for the file
    const metadata = this.metadata.get(filePath);
    
    if (!metadata) {
      // If metadata doesn't exist yet, create it
      const fileName = filePath.split(/[/\\]/).pop() || '';
      const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      const newMetadata = {
        size: hash * 1000,
        lastModified: new Date(),
        durationInSeconds: 10 + (hash % 50) // 10-60 seconds
      };
      
      this.metadata.set(filePath, newMetadata);
      return newMetadata;
    }
    
    return metadata;
  }
  
  // Helper method to check what files are in the store (for testing)
  getStoredFiles(): string[] {
    return Array.from(this.fileStore.keys());
  }
  
  // Reset the mock for testing
  reset(): void {
    this.fileStore.clear();
    this.metadata.clear();
    
    // Reinitialize with mock data
    this.mockFiles.forEach(path => {
      this.fileStore.set(path, `Mock content for ${path}`);
      
      const fileName = path.split(/[/\\]/).pop() || '';
      const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      this.metadata.set(path, {
        size: hash * 1000,
        lastModified: new Date(),
        durationInSeconds: 10 + (hash % 50) // 10-60 seconds
      });
    });
  }
} 