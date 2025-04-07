import { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { MediaService } from './MediaService';
import { SUPPORTED_EXTENSIONS } from '../services/media/MediaMetadata';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const extension = path.extname(file.originalname).slice(1).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(extension)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${extension}`));
        }
    }
});

export class MediaController {
    private mediaService: MediaService;
    private uploadMiddleware: any;

    constructor(mediaService: MediaService) {
        this.mediaService = mediaService;
        this.uploadMiddleware = upload.single('file');
    }

    /**
     * Upload a media file
     */
    public async uploadMedia(req: Request, res: Response): Promise<void> {
        try {
            // Use multer to handle the file upload
            this.uploadMiddleware(req, res, async (err: any) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }

                if (!req.file) {
                    res.status(400).json({ error: 'No file uploaded' });
                    return;
                }

                const filename = req.file.originalname;
                const buffer = req.file.buffer;

                const result = await this.mediaService.uploadMedia(filename, buffer);

                if (!result) {
                    res.status(500).json({ error: 'Failed to process media file' });
                    return;
                }

                res.status(201).json(result);
            });
        } catch (error) {
            console.error('Error handling upload:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * List all media files
     */
    public async listMedia(req: Request, res: Response): Promise<void> {
        try {
            const mediaList = await this.mediaService.getMediaList();
            res.json(mediaList);
        } catch (error) {
            console.error('Error listing media:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get a specific media file
     */
    public async getMedia(req: Request, res: Response): Promise<void> {
        try {
            const filename = req.params.filename;
            const file = await this.mediaService.getMedia(filename);

            if (!file) {
                res.status(404).json({ error: 'Media file not found' });
                return;
            }

            // Get MIME type based on file extension
            const extension = path.extname(filename).slice(1).toLowerCase();
            const contentType = this.getMimeTypeForExtension(extension);

            // Set appropriate headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', file.length);

            // Send the file
            res.send(file);
        } catch (error) {
            console.error('Error retrieving media:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * List all thumbnail files
     */
    public async listThumbnails(req: Request, res: Response): Promise<void> {
        try {
            const thumbnails = await this.mediaService.getThumbnailsList();
            res.json(thumbnails);
        } catch (error) {
            console.error('Error listing thumbnails:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get a specific thumbnail file
     */
    public async getThumbnail(req: Request, res: Response): Promise<void> {
        try {
            const filename = req.params.filename;
            const file = await this.mediaService.getThumbnail(filename);

            if (!file) {
                res.status(404).json({ error: 'Thumbnail not found' });
                return;
            }

            // Set appropriate headers
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Length', file.length);

            // Send the file
            res.send(file);
        } catch (error) {
            console.error('Error retrieving thumbnail:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get MIME type based on file extension
     */
    private getMimeTypeForExtension(extension: string): string {
        switch (extension) {
            case 'mp4':
                return 'video/mp4';
            case 'webm':
                return 'video/webm';
            case 'mov':
                return 'video/quicktime';
            case 'avi':
                return 'video/x-msvideo';
            case 'mkv':
                return 'video/x-matroska';
            default:
                return 'application/octet-stream';
        }
    }
} 