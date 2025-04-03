/**
 * Pure utility functions for path manipulation
 */

/**
 * Normalizes a file path by ensuring consistent format
 */
export const normalizePath = (path: string): string => {
    // Remove leading slash if present
    return path.startsWith('/') ? path.substring(1) : path;
};

/**
 * Splits a path into directory path and filename
 */
export const splitPath = (filePath: string): [string, string] => {
    const normalizedPath = normalizePath(filePath);
    const lastSlashIndex = normalizedPath.lastIndexOf('/');

    if (lastSlashIndex === -1) {
        return ['', normalizedPath];
    }

    const dirPath = normalizedPath.substring(0, lastSlashIndex);
    const fileName = normalizedPath.substring(lastSlashIndex + 1);

    return [dirPath, fileName];
};

/**
 * Extracts just the filename from a path
 */
export const getFileName = (filePath: string): string => {
    const [, fileName] = splitPath(filePath);
    return fileName;
};

/**
 * Joins path segments into a single path
 */
export const joinPaths = (...segments: string[]): string => {
    return segments
        .filter(segment => segment.trim() !== '')
        .join('/')
        .replace(/\/+/g, '/'); // Replace multiple consecutive slashes with a single one
};

/**
 * Gets the file extension from a path
 */
export const getFileExtension = (filePath: string): string => {
    const fileName = getFileName(filePath);
    const match = fileName.match(/\.([^/.]+)$/);
    return match ? match[1].toLowerCase() : '';
}; 