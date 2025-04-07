// Simple launcher for the media server
require('ts-node/register/transpile-only');
// Force CommonJS module resolution
process.env.TS_NODE_MODULE = 'commonjs';
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
require('./src/MediaServer/startServer.ts'); 