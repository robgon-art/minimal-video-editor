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
}

// Create a singleton instance
export const fileSystem = typeof window !== 'undefined' && 
  typeof window.showDirectoryPicker === 'function'
  ? new BrowserFileSystem() 
  : new MockFileSystem(); 