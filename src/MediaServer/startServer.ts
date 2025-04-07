#!/usr/bin/env node

/**
 * Script to start the Media Server
 */
import { createMediaServer } from './MediaServer';

// Get port from command line or environment variable
const port = process.env.MEDIA_SERVER_PORT
    ? parseInt(process.env.MEDIA_SERVER_PORT, 10)
    : process.argv[2]
        ? parseInt(process.argv[2], 10)
        : 3001;

// Create and start the server
const server = createMediaServer(port);
server.start();

console.log(`MediaServer started on port ${port}`);
console.log(`Media endpoint: http://localhost:${port}/media`);
console.log(`Thumbnails endpoint: http://localhost:${port}/thumbnails`);

// Handle termination signals
process.on('SIGINT', () => {
    console.log('Shutting down media server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down media server...');
    process.exit(0);
}); 