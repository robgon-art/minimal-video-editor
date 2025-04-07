import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { MediaController } from './MediaController';
import { MediaService } from './MediaService';
import { MediaRepository } from './MediaRepository';
import { ThumbnailGenerator } from './ThumbnailGenerator';

export interface MediaServerConfig {
    port: number;
    mediaStoragePath: string;
    thumbnailStoragePath: string;
    // Add optional dependencies for easier testing
    mediaController?: MediaController;
    mediaService?: MediaService;
    mediaRepository?: MediaRepository;
    thumbnailGenerator?: ThumbnailGenerator;
}

export class MediaServer {
    private app: Express;
    private port: number;
    private mediaController: MediaController;

    constructor(config: MediaServerConfig) {
        this.app = express();
        this.port = config.port;

        // Set up middleware
        this.app.use(cors());
        this.app.use(express.json());

        // Use provided controller or create the full dependency chain
        if (config.mediaController) {
            this.mediaController = config.mediaController;
        } else {
            // Create repository
            const mediaRepository = config.mediaRepository || new MediaRepository({
                mediaPath: config.mediaStoragePath,
                thumbnailPath: config.thumbnailStoragePath
            });

            // Create thumbnail generator
            const thumbnailGenerator = config.thumbnailGenerator || new ThumbnailGenerator(config.thumbnailStoragePath);

            // Create service
            const mediaService = config.mediaService || new MediaService(mediaRepository, thumbnailGenerator);

            // Create controller
            this.mediaController = new MediaController(mediaService);
        }

        // Set up routes
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Media endpoints
        this.app.post('/media', (req: Request, res: Response) =>
            this.mediaController.uploadMedia(req, res));

        this.app.get('/media', (req: Request, res: Response) =>
            this.mediaController.listMedia(req, res));

        this.app.get('/media/:filename', (req: Request, res: Response) =>
            this.mediaController.getMedia(req, res));

        // Thumbnail endpoints
        this.app.get('/thumbnails', (req: Request, res: Response) =>
            this.mediaController.listThumbnails(req, res));

        this.app.get('/thumbnails/:filename', (req: Request, res: Response) =>
            this.mediaController.getThumbnail(req, res));
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Media server running on port ${this.port}`);
        });
    }

    // Exposed for testing
    public getApp(): Express {
        return this.app;
    }
}

// Utility to create and start server with default configuration
export const createMediaServer = (port = 3001): MediaServer => {
    const config: MediaServerConfig = {
        port,
        mediaStoragePath: path.join(process.cwd(), 'media'),
        thumbnailStoragePath: path.join(process.cwd(), 'media', 'thumbnails')
    };
    
    const server = new MediaServer(config);
    return server;
}; 