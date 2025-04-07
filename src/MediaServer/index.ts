import { createMediaServer } from './MediaServer';

// Default port for the server
const DEFAULT_PORT = 3001;

// Get port from environment variable if available
const port = process.env.MEDIA_SERVER_PORT
    ? parseInt(process.env.MEDIA_SERVER_PORT, 10)
    : DEFAULT_PORT;

// Create and start the server
const server = createMediaServer(port);
server.start(); 