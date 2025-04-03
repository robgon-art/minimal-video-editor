import {
    normalizePath,
    splitPath,
    getFileName,
    joinPaths,
    getFileExtension
} from './PathUtils';

describe('PathUtils', () => {
    describe('normalizePath', () => {
        it('should remove leading slash', () => {
            expect(normalizePath('/path/to/file.txt')).toBe('path/to/file.txt');
        });

        it('should leave path unchanged if no leading slash', () => {
            expect(normalizePath('path/to/file.txt')).toBe('path/to/file.txt');
        });
    });

    describe('splitPath', () => {
        it('should split path into directory and filename', () => {
            const [dir, file] = splitPath('/path/to/file.txt');
            expect(dir).toBe('path/to');
            expect(file).toBe('file.txt');
        });

        it('should handle paths with no directory', () => {
            const [dir, file] = splitPath('file.txt');
            expect(dir).toBe('');
            expect(file).toBe('file.txt');
        });

        it('should handle paths with trailing slash', () => {
            const [dir, file] = splitPath('/path/to/');
            expect(dir).toBe('path/to');
            expect(file).toBe('');
        });
    });

    describe('getFileName', () => {
        it('should extract filename from path', () => {
            expect(getFileName('/path/to/file.txt')).toBe('file.txt');
        });

        it('should return path if no directory', () => {
            expect(getFileName('file.txt')).toBe('file.txt');
        });
    });

    describe('joinPaths', () => {
        it('should join path segments', () => {
            expect(joinPaths('path', 'to', 'file.txt')).toBe('path/to/file.txt');
        });

        it('should handle empty segments', () => {
            expect(joinPaths('path', '', 'file.txt')).toBe('path/file.txt');
        });

        it('should normalize multiple slashes', () => {
            expect(joinPaths('path/', '/to/', '/file.txt')).toBe('path/to/file.txt');
        });
    });

    describe('getFileExtension', () => {
        it('should extract extension from filename', () => {
            expect(getFileExtension('file.txt')).toBe('txt');
        });

        it('should extract extension from path', () => {
            expect(getFileExtension('/path/to/file.txt')).toBe('txt');
        });

        it('should return empty string if no extension', () => {
            expect(getFileExtension('file')).toBe('');
        });

        it('should handle filenames with multiple dots', () => {
            expect(getFileExtension('file.name.txt')).toBe('txt');
        });
    });
}); 