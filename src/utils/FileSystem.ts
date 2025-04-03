import { FileOperation } from './FileOperations';

// Add type definitions for File System Access API
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: ArrayBuffer): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
}

// Interface for the real file system operations
export interface IFileSystem {
  executeOperation: (operation: FileOperation) => Promise<any>;
  copyFile: (sourcePath: string, destinationPath: string) => Promise<boolean>;
  readDirectory: (directoryPath: string) => Promise<string[]>;
  getFileMetadata: (filePath: string) => Promise<{ 
    size: number; 
    lastModified: Date;
    durationInSeconds: number; 
  }>;
  writeFile: (filePath: string, data: ArrayBuffer) => Promise<boolean>;
  createDirectory: (directoryPath: string) => Promise<boolean>;
}

// Mock implementation for testing
export class MockFileSystem implements IFileSystem {
  private mockFiles: { [path: string]: { size: number; lastModified: Date; durationInSeconds: number } } = {
    '/media/sample1.mp4': { size: 1024, lastModified: new Date(), durationInSeconds: 30 },
    '/media/sample2.mov': { size: 2048, lastModified: new Date(), durationInSeconds: 45 },
    '/media/sample3.avi': { size: 3072, lastModified: new Date(), durationInSeconds: 60 }
  };

  async executeOperation(operation: FileOperation): Promise<any> {
    switch (operation.type) {
      case 'COPY_FILE':
        return this.copyFile(operation.sourcePath, operation.destinationPath);
      case 'READ_DIRECTORY':
        return this.readDirectory(operation.directoryPath);
      case 'GET_FILE_METADATA':
        return this.getFileMetadata(operation.filePath);
      case 'WRITE_FILE':
        return this.writeFile(operation.filePath, operation.data);
      case 'CREATE_DIRECTORY':
        return this.createDirectory(operation.directoryPath);
      default:
        throw new Error(`Unsupported operation: ${(operation as any).type}`);
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    if (this.mockFiles[sourcePath]) {
      this.mockFiles[destinationPath] = this.mockFiles[sourcePath];
      return true;
    }
    return false;
  }

  async readDirectory(directoryPath: string): Promise<string[]> {
    return Object.keys(this.mockFiles)
      .filter(path => path.startsWith(directoryPath))
      .map(path => path);
  }

  async getFileMetadata(filePath: string): Promise<{ 
    size: number; 
    lastModified: Date;
    durationInSeconds: number; 
  }> {
    if (this.mockFiles[filePath]) {
      return this.mockFiles[filePath];
    }
    throw new Error(`File not found: ${filePath}`);
  }

  async writeFile(filePath: string, data: ArrayBuffer): Promise<boolean> {
    try {
      // Simulate writing a file by creating an entry in the mockFiles
      this.mockFiles[filePath] = { 
        size: data.byteLength, 
        lastModified: new Date(), 
        durationInSeconds: 30 // Default duration for mock files
      };
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  async createDirectory(directoryPath: string): Promise<boolean> {
    // Mock implementation doesn't need to do anything for directories
    return true;
  }
}

// Browser-based implementation of file system operations
export class BrowserFileSystem implements IFileSystem {
  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    try {
      return await window.showDirectoryPicker();
    } catch (err) {
      console.error('Error accessing directory:', err);
      throw err;
    }
  }

  async executeOperation(operation: FileOperation): Promise<any> {
    switch (operation.type) {
      case 'COPY_FILE':
        return this.copyFile(operation.sourcePath, operation.destinationPath);
      case 'READ_DIRECTORY':
        return this.readDirectory(operation.directoryPath);
      case 'GET_FILE_METADATA':
        return this.getFileMetadata(operation.filePath);
      case 'WRITE_FILE':
        return this.writeFile(operation.filePath, operation.data);
      case 'CREATE_DIRECTORY':
        return this.createDirectory(operation.directoryPath);
      default:
        throw new Error(`Unsupported operation: ${(operation as any).type}`);
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      const [sourceDir, sourceName] = sourcePath.split('/').slice(-2);
      const [destDir, destName] = destinationPath.split('/').slice(-2);

      const sourceDirHandle = await this.getDirectoryHandle(sourceDir);
      const destDirHandle = await this.getDirectoryHandle(destDir);

      const sourceFileHandle = await sourceDirHandle.getFileHandle(sourceName);
      const sourceFile = await sourceFileHandle.getFile();
      
      const destFileHandle = await destDirHandle.getFileHandle(destName, { create: true });
      const writable = await destFileHandle.createWritable();
      await writable.write(await sourceFile.arrayBuffer());
      await writable.close();
      
      return true;
    } catch (err) {
      console.error('Error copying file:', err);
      return false;
    }
  }

  async readDirectory(directoryPath: string): Promise<string[]> {
    try {
      const dirHandle = await this.getDirectoryHandle(directoryPath);
      const files: string[] = [];
      
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          files.push(`${directoryPath}/${name}`);
        }
      }
      
      return files;
    } catch (err) {
      console.error('Error reading directory:', err);
      return [];
    }
  }

  async getFileMetadata(filePath: string): Promise<{ 
    size: number; 
    lastModified: Date;
    durationInSeconds: number; 
  }> {
    try {
      const [dir, name] = filePath.split('/').slice(-2);
      const dirHandle = await this.getDirectoryHandle(dir);
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();

      // For video duration, we'll need to use the Web Audio API or a video element
      // This is a simplified version that just returns a default duration
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve({
            size: file.size,
            lastModified: new Date(file.lastModified),
            durationInSeconds: video.duration
          });
          URL.revokeObjectURL(video.src);
        };
      });
    } catch (err) {
      console.error('Error getting file metadata:', err);
      throw err;
    }
  }

  async writeFile(filePath: string, data: ArrayBuffer): Promise<boolean> {
    try {
      const [dirPath, fileName] = this.splitPath(filePath);
      
      // Get directory handle
      const dirHandle = await this.getDirectoryHandle(dirPath);
      
      // Create or open the file
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      
      // Get a writable stream to the file
      const writable = await fileHandle.createWritable();
      
      // Write the data
      await writable.write(data);
      
      // Close the stream
      await writable.close();
      
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  async createDirectory(directoryPath: string): Promise<boolean> {
    try {
      // Skip the leading slash if present
      const normalizedPath = directoryPath.startsWith('/') 
        ? directoryPath.substring(1) 
        : directoryPath;
      
      // Split the path into segments
      const pathSegments = normalizedPath.split('/').filter(segment => segment);
      
      // Start with the root directory handle
      let currentDirHandle = await navigator.storage.getDirectory();
      
      // Create each directory in the path if it doesn't exist
      for (const segment of pathSegments) {
        currentDirHandle = await currentDirHandle.getDirectoryHandle(segment, { create: true });
      }
      
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  }

  // Helper method to split a path into directory path and filename
  private splitPath(filePath: string): [string, string] {
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    if (lastSlashIndex === -1) {
      return ['', normalizedPath];
    }
    
    const dirPath = normalizedPath.substring(0, lastSlashIndex);
    const fileName = normalizedPath.substring(lastSlashIndex + 1);
    
    return [dirPath, fileName];
  }
}

// Create a singleton instance
export const fileSystem = typeof window !== 'undefined' && 
  typeof window.showDirectoryPicker === 'function'
  ? new BrowserFileSystem() 
  : new MockFileSystem(); 