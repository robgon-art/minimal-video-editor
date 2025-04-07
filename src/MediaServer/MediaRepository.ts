import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { MediaMetadata } from '../services/media/MediaMetadata';
import { SUPPORTED_EXTENSIONS } from '../services/media/MediaMetadata';

// Promisified file system operations
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface MediaRepositoryConfig {
    mediaPath: string;
    thumbnailPath: string;
}

export class MediaRepository {
    private mediaPath: string;
    private thumbnailPath: string;

    constructor(config: MediaRepositoryConfig) {
        this.mediaPath = config.mediaPath;
        this.thumbnailPath = config.thumbnailPath;
        this.ensureDirectoriesExist();
    }

    private async ensureDirectoriesExist(): Promise<void> {
        try {
            // Ensure media directory exists
            await mkdir(this.mediaPath, { recursive: true });

            // Ensure thumbnails directory exists
            await mkdir(this.thumbnailPath, { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    public async listMediaFiles(): Promise<string[]> {
        try {
            const files = await readdir(this.mediaPath);

            // Filter out directories and unsupported files
            const mediaFiles = [];

            for (const file of files) {
                if (file === 'thumbnails') continue; // Skip thumbnails directory

                const filePath = path.join(this.mediaPath, file);
                const stats = await stat(filePath);

                if (stats.isFile()) {
                    const extension = path.extname(file).slice(1).toLowerCase();
                    if (SUPPORTED_EXTENSIONS.includes(extension)) {
                        mediaFiles.push(file);
                    }
                }
            }

            return mediaFiles;
        } catch (error) {
            console.error('Error listing media files:', error);
            return [];
        }
    }

    public async listThumbnailFiles(): Promise<string[]> {
        try {
            const files = await readdir(this.thumbnailPath);

            // Filter out directories, only include image files
            const thumbnailFiles = [];

            for (const file of files) {
                const filePath = path.join(this.thumbnailPath, file);
                const stats = await stat(filePath);

                if (stats.isFile()) {
                    const extension = path.extname(file).slice(1).toLowerCase();
                    if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
                        thumbnailFiles.push(file);
                    }
                }
            }

            return thumbnailFiles;
        } catch (error) {
            console.error('Error listing thumbnail files:', error);
            return [];
        }
    }

    public async getMediaFilePath(filename: string): Promise<string> {
        return path.join(this.mediaPath, filename);
    }

    public async getThumbnailFilePath(filename: string): Promise<string> {
        // Convert video filename to thumbnail filename
        const fileNameWithoutExt = path.parse(filename).name;
        const thumbnailFilename = `${fileNameWithoutExt}.jpg`;
        return path.join(this.thumbnailPath, thumbnailFilename);
    }

    public async saveMediaFile(filename: string, data: Buffer): Promise<boolean> {
        try {
            const filePath = path.join(this.mediaPath, filename);
            await writeFile(filePath, data);
            return true;
        } catch (error) {
            console.error('Error saving media file:', error);
            return false;
        }
    }

    public async saveThumbnailFile(filename: string, data: Buffer): Promise<boolean> {
        try {
            const filePath = path.join(this.thumbnailPath, filename);
            await writeFile(filePath, data);
            return true;
        } catch (error) {
            console.error('Error saving thumbnail file:', error);
            return false;
        }
    }

    public async getMediaFile(filename: string): Promise<Buffer | null> {
        try {
            const filePath = path.join(this.mediaPath, filename);
            return await readFile(filePath);
        } catch (error) {
            console.error('Error getting media file:', error);
            return null;
        }
    }

    public async getThumbnailFile(filename: string): Promise<Buffer | null> {
        try {
            const filePath = path.join(this.thumbnailPath, filename);
            return await readFile(filePath);
        } catch (error) {
            console.error('Error getting thumbnail file:', error);
            return null;
        }
    }

    public async getMediaMetadata(filename: string): Promise<MediaMetadata | null> {
        try {
            const filePath = path.join(this.mediaPath, filename);
            const stats = await stat(filePath);

            // Basic metadata from file stats
            return {
                size: stats.size,
                lastModified: stats.mtime,
                durationInSeconds: 0 // This will be updated later by the ThumbnailGenerator
            };
        } catch (error) {
            console.error('Error getting media metadata:', error);
            return null;
        }
    }

    public async updateMediaMetadata(filename: string, metadata: Partial<MediaMetadata>): Promise<boolean> {
        // In a file-based system, we don't have a separate metadata store
        // In a real implementation, this would save metadata to a database or sidecar file
        // For now, we'll just return true since we're focusing on the file operations
        return true;
    }
} 