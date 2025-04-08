import { MediaServiceClient } from './MediaServiceClient';

// Create and export a singleton instance
// Use environment variable for API URL if available
export const mediaService = new MediaServiceClient(
    process.env.REACT_APP_API_URL || 'http://localhost:3001'
); 