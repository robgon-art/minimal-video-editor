import { Clip, createClipFromFile } from '../../Clip/ClipModel';
import { MediaMetadata } from './MediaMetadata';

/**
 * Client adapter to communicate with the MediaServer REST API
 */
export class MediaServiceClient {
    private apiBaseUrl: string;

    constructor(baseUrl: string = 'http://localhost:3001') {
        this.apiBaseUrl = baseUrl;
    }

    /**
     * Scan media folder to get available clips
     */
    public async scanMediaFolder(): Promise<Clip[]> {
        try {
            // Fetch media list from API
            const response = await fetch(`${this.apiBaseUrl}/media`);

            if (!response.ok) {
                throw new Error(`Failed to scan media folder: ${response.statusText}`);
            }

            const mediaList = await response.json();

            // Convert to Clip objects
            return mediaList.map((media: any) => {
                return createClipFromFile(
                    `/media/${media.filename}`, // Use virtual path format
                    media.filename, // Keep the full filename with extension as title
                    media.metadata.durationInSeconds
                );
            });
        } catch (error) {
            console.error('Error scanning media folder:', error);
            return [];
        }
    }

    /**
     * Import media files and upload to server
     */
    public async importMediaFiles(files: File[]): Promise<Clip[]> {
        if (files.length === 0) {
            return [];
        }

        try {
            // Process each file
            const clipPromises = files.map(async (file: File) => {
                try {
                    // Create form data for upload
                    const formData = new FormData();
                    formData.append('file', file);

                    // Upload file
                    const response = await fetch(`${this.apiBaseUrl}/media`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to upload file ${file.name}: ${response.statusText}`);
                    }

                    const result = await response.json();

                    // Create a clip object
                    return createClipFromFile(
                        `/media/${result.filename}`, // Use virtual path format
                        result.filename,
                        result.metadata.durationInSeconds
                    );
                } catch (error) {
                    console.error(`Error uploading file ${file.name}:`, error);
                    // Return null for failed uploads, we'll filter these out below
                    return null;
                }
            });

            // Wait for all operations to complete and filter out failed uploads
            const results = await Promise.all(clipPromises);
            return results.filter((clip): clip is Clip => clip !== null);
        } catch (error) {
            console.error('Error importing media files:', error);
            return [];
        }
    }

    /**
     * Get a thumbnail URL for a media file
     */
    public getThumbnailUrl(mediaPath: string): string {
        // Extract filename from virtual path
        const filename = mediaPath.split('/').pop() || '';
        return `${this.apiBaseUrl}/thumbnails/${filename}`;
    }

    /**
     * Get a media file URL
     */
    public getMediaUrl(mediaPath: string): string {
        // Extract filename from virtual path
        const filename = mediaPath.split('/').pop() || '';
        return `${this.apiBaseUrl}/media/${filename}`;
    }
} 