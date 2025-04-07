import path from 'path';
import { MediaRepository } from './MediaRepository';
import { ThumbnailGenerator, VideoMetadata } from './ThumbnailGenerator';
import { MediaMetadata } from '../services/media/MediaMetadata';
import { SUPPORTED_EXTENSIONS } from '../services/media/MediaMetadata';

export interface MediaInfo {
    filename: string;
    metadata: MediaMetadata;
}

export class MediaService {
    private mediaRepository: MediaRepository;
    private thumbnailGenerator: ThumbnailGenerator;

    constructor(
        mediaRepository: MediaRepository,
        thumbnailGenerator: ThumbnailGenerator
    ) {
        this.mediaRepository = mediaRepository;
        this.thumbnailGenerator = thumbnailGenerator;
    }

    /**
     * Get a list of all media files with metadata
     */
    public async getMediaList(): Promise<MediaInfo[]> {
        const filenames = await this.mediaRepository.listMediaFiles();

        const mediaInfoPromises = filenames.map(async (filename) => {
            const metadata = await this.mediaRepository.getMediaMetadata(filename);
            return {
                filename,
                metadata: metadata || {
                    size: 0,
                    lastModified: new Date(),
                    durationInSeconds: 0
                }
            };
        });

        return Promise.all(mediaInfoPromises);
    }

    /**
     * Upload a new media file and generate its thumbnail
     */
    public async uploadMedia(filename: string, data: Buffer): Promise<MediaInfo | null> {
        try {
            // Validate file extension
            const extension = path.extname(filename).slice(1).toLowerCase();
            if (!SUPPORTED_EXTENSIONS.includes(extension)) {
                throw new Error(`Unsupported file type: ${extension}`);
            }

            // Save the media file
            const saveResult = await this.mediaRepository.saveMediaFile(filename, data);

            if (!saveResult) {
                throw new Error('Failed to save media file');
            }

            // Get the full path to the saved file
            const mediaFilePath = await this.mediaRepository.getMediaFilePath(filename);

            // Generate thumbnail
            const thumbnailFilename = `${path.parse(filename).name}.jpg`;
            const videoMetadata = await this.thumbnailGenerator.generateThumbnail(
                mediaFilePath,
                thumbnailFilename
            );

            // Create metadata from video information
            const metadata: MediaMetadata = {
                size: data.length,
                lastModified: new Date(),
                durationInSeconds: videoMetadata.durationInSeconds
            };

            // Update the metadata
            await this.mediaRepository.updateMediaMetadata(filename, metadata);

            return {
                filename,
                metadata
            };
        } catch (error) {
            console.error('Error uploading media:', error);
            return null;
        }
    }

    /**
     * Get a media file by filename
     */
    public async getMedia(filename: string): Promise<Buffer | null> {
        return this.mediaRepository.getMediaFile(filename);
    }

    /**
     * Get a thumbnail file by the original media filename
     */
    public async getThumbnail(mediaFilename: string): Promise<Buffer | null> {
        // Get the thumbnail filename from media filename
        const thumbnailFilename = `${path.parse(mediaFilename).name}.jpg`;
        return this.mediaRepository.getThumbnailFile(thumbnailFilename);
    }

    /**
     * Get a list of all thumbnail files
     */
    public async getThumbnailsList(): Promise<string[]> {
        return this.mediaRepository.listThumbnailFiles();
    }

    /**
     * Get media metadata by filename
     */
    public async getMediaMetadata(filename: string): Promise<MediaMetadata | null> {
        return this.mediaRepository.getMediaMetadata(filename);
    }
} 