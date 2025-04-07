import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Configure ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

// Promisified file system operations
const unlink = promisify(fs.unlink);

export interface VideoMetadata {
    durationInSeconds: number;
    width?: number;
    height?: number;
    fps?: number;
}

export class ThumbnailGenerator {
    private outputDir: string;

    constructor(outputDir: string) {
        this.outputDir = outputDir;
    }

    /**
     * Generate a thumbnail from a video file
     * @param videoPath Path to the video file
     * @param outputFilename Name for the output thumbnail file
     * @returns Promise with video metadata including duration
     */
    public async generateThumbnail(
        videoPath: string,
        outputFilename: string
    ): Promise<VideoMetadata> {
        // Ensure output filename has .jpg extension
        if (!outputFilename.toLowerCase().endsWith('.jpg')) {
            outputFilename = `${path.parse(outputFilename).name}.jpg`;
        }

        const outputPath = path.join(this.outputDir, outputFilename);

        return new Promise((resolve, reject) => {
            // Create ffmpeg command
            const command = ffmpeg(videoPath)
                // Take screenshot at first frame
                .screenshots({
                    timestamps: [0],
                    filename: outputFilename,
                    folder: this.outputDir,
                    size: '640x?', // 640px width, maintain aspect ratio
                });

            // Get video metadata
            let metadata: VideoMetadata = {
                durationInSeconds: 0
            };

            command.ffprobe((err, data) => {
                if (!err && data) {
                    // Extract video stream info
                    const videoStream = data.streams.find(stream => stream.codec_type === 'video');
                    if (videoStream) {
                        metadata = {
                            durationInSeconds: data.format.duration || 0,
                            width: videoStream.width,
                            height: videoStream.height,
                            fps: this.calculateFps(videoStream)
                        };
                    } else {
                        metadata.durationInSeconds = data.format.duration || 0;
                    }
                }
            });

            // Handle success
            command.on('end', () => {
                console.log(`Thumbnail generated: ${outputPath}`);
                resolve(metadata);
            });

            // Handle error
            command.on('error', (err) => {
                console.error('Error generating thumbnail:', err);
                reject(err);
            });
        });
    }

    /**
     * Calculate frames per second from video stream data
     */
    private calculateFps(videoStream: any): number {
        if (videoStream.r_frame_rate) {
            const [numerator, denominator] = videoStream.r_frame_rate.split('/');
            if (numerator && denominator) {
                return parseInt(numerator, 10) / parseInt(denominator, 10);
            }
        }

        // Default to 24fps if calculation fails
        return 24;
    }

    /**
     * Extract metadata from a video file without generating a thumbnail
     * @param videoPath Path to the video file
     * @returns Promise with video metadata
     */
    public async extractMetadata(videoPath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, data) => {
                if (err) {
                    console.error('Error extracting metadata:', err);
                    reject(err);
                    return;
                }

                // Extract video stream info
                const videoStream = data.streams.find(stream => stream.codec_type === 'video');

                if (videoStream) {
                    const metadata: VideoMetadata = {
                        durationInSeconds: data.format.duration || 0,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: this.calculateFps(videoStream)
                    };
                    resolve(metadata);
                } else {
                    // No video stream found
                    resolve({
                        durationInSeconds: data.format.duration || 0
                    });
                }
            });
        });
    }
} 