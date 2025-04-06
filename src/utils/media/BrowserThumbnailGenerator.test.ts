import {
    getThumbnailPath,
    ensureThumbnailsDirectoryExists,
    generateThumbnail,
    ensureThumbnailExists,
    THUMBNAILS_FOLDER_PATH
} from './BrowserThumbnailGenerator';
import { fileSystem } from '../../services/storage/FileSystem';
import { executeOperation } from '../../infrastructure/io/IOEffects';

// Mock dependencies
jest.mock('../../services/storage/FileSystem', () => ({
    fileSystem: {}
}));

jest.mock('../../infrastructure/io/IOEffects', () => ({
    executeOperation: jest.fn()
}));

// Silence console logs during tests
let originalConsoleLog: typeof console.log;
let originalConsoleError: typeof console.error;

// Helper to test browser vs non-browser environments
const mockIsBrowser = (isBrowserValue: boolean) => {
    // Instead of modifying window.undefined, we'll mock the implementation
    // by overriding the value used by the isBrowser check in the code
    const originalWindow = global.window;

    if (isBrowserValue) {
        // Make sure window is defined (browser environment)
        if (global.window === undefined) {
            global.window = {} as any;
        }
    } else {
        // Make window undefined (non-browser environment)
        global.window = undefined as any;

        // Add a more direct mock to ensure isBrowser returns false
        jest.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);
    }

    return () => {
        global.window = originalWindow;
        jest.restoreAllMocks(); // Clean up any spies
    };
};

// Mock Blob with arrayBuffer method
class MockBlob extends Blob {
    arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(new ArrayBuffer(this.size));
    }
}

// Helper to setup common mocks for thumbnail generation tests
function setupThumbnailMocks() {
    // Mock canvas and video elements
    const mockVideoElement = {
        src: '',
        crossOrigin: '',
        muted: false,
        preload: '',
        duration: 10,
        currentTime: 0,
        videoWidth: 1280,
        videoHeight: 720,
        onloadedmetadata: null,
        onseeked: null,
        onerror: null,
        load: jest.fn(function (this: any) {
            // Simulate video loaded metadata
            setTimeout(() => {
                if (this.onloadedmetadata) {
                    this.onloadedmetadata();
                }

                // Simulate seeking completed
                setTimeout(() => {
                    if (this.onseeked) {
                        this.onseeked();
                    }
                }, 10);
            }, 10);
        }),
        error: null
    };

    const mockCanvasContext = {
        drawImage: jest.fn()
    };

    const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(mockCanvasContext),
        toBlob: jest.fn((callback) => callback(new MockBlob(['mock-data'], { type: 'image/jpeg' })))
    };

    // Mock document.createElement
    document.createElement = jest.fn((tagName) => {
        if (tagName === 'video') return mockVideoElement as any;
        if (tagName === 'canvas') return mockCanvas as any;
        return document.createElement(tagName);
    });

    // Mock URL methods
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = jest.fn();

    // Mock fileSystem operations for successful cases
    (executeOperation as jest.Mock).mockImplementation((_, operation) => {
        if (operation.type === 'READ') {
            return Promise.resolve({ data: new ArrayBuffer(1024) });
        }
        if (operation.type === 'WRITE') {
            return Promise.resolve(true);
        }
        if (operation.type === 'CREATE_DIRECTORY') {
            return Promise.resolve(true);
        }
        return Promise.resolve(null);
    });

    return {
        mockVideoElement,
        mockCanvas,
        mockCanvasContext
    };
}

describe('BrowserThumbnailGenerator', () => {
    // Increase test timeout to avoid timeout issues
    jest.setTimeout(10000);

    // Set up console mocks before all tests
    beforeAll(() => {
        // Save original console methods
        originalConsoleLog = console.log;
        originalConsoleError = console.error;

        // Silence console output during tests
        console.log = jest.fn();
        console.error = jest.fn();
    });

    // Restore console after all tests
    afterAll(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        
        // Clean up any open database connections
        // Since we're mocking fileSystem, we need to ensure the real implementation is invoked
        const realFileSystem = jest.requireActual('../../services/storage/FileSystem').fileSystem;
        realFileSystem.closeDB();
        
        // Force close any IndexedDB connections
        if (typeof indexedDB !== 'undefined') {
            indexedDB.deleteDatabase('videoEditorFileSystem');
        }
    });

    // Reset mocks between tests
    beforeEach(() => {
        jest.clearAllMocks();

        // Ensure we're in a browser environment by default
        if (global.window === undefined) {
            global.window = {} as any;
        }

        // Clear thumbnail cache
        // This is a hack to access the private cache, normally not recommended
        // but necessary for testing cache behavior
        const moduleCache = require('./BrowserThumbnailGenerator');
        if (moduleCache._thumbnailCache) {
            moduleCache._thumbnailCache.clear();
        }
    });

    describe('getThumbnailPath', () => {
        it('should generate correct thumbnail path from video path', () => {
            expect(getThumbnailPath('/videos/my video.mp4')).toBe('/media/thumbnails/my_video.jpg');
            expect(getThumbnailPath('sample.mp4')).toBe('/media/thumbnails/sample.jpg');
        });

        it('should handle files with multiple dots', () => {
            expect(getThumbnailPath('/videos/my.special.video.mp4')).toBe('/media/thumbnails/my.special.video.jpg');
        });
    });

    describe('ensureThumbnailsDirectoryExists', () => {
        it('should create thumbnails directory if it does not exist', async () => {
            // Setup a successful operation
            (executeOperation as jest.Mock).mockResolvedValueOnce(true);

            await ensureThumbnailsDirectoryExists();

            expect(executeOperation).toHaveBeenCalledTimes(1);
            // First argument should be fileSystem
            expect((executeOperation as jest.Mock).mock.calls[0][0]).toBe(fileSystem);
            // Second argument should be a create directory operation for the thumbnails path
            expect((executeOperation as jest.Mock).mock.calls[0][1].path).toBe(THUMBNAILS_FOLDER_PATH);
            expect((executeOperation as jest.Mock).mock.calls[0][1].type).toBe('CREATE_DIRECTORY');
        });

        it('should handle case where directory already exists', async () => {
            // Setup a failed operation (directory exists)
            (executeOperation as jest.Mock).mockRejectedValueOnce(new Error('Directory already exists'));

            // Should not throw
            await expect(ensureThumbnailsDirectoryExists()).resolves.not.toThrow();
        });
    });

    describe('generateThumbnail', () => {
        let originalCreateElement: typeof document.createElement;
        let originalCreateObjectURL: typeof URL.createObjectURL;
        let originalRevokeObjectURL: typeof URL.revokeObjectURL;

        beforeEach(() => {
            // Save original methods
            originalCreateElement = document.createElement;
            originalCreateObjectURL = URL.createObjectURL;
            originalRevokeObjectURL = URL.revokeObjectURL;

            // Setup mocks
            setupThumbnailMocks();
        });

        afterEach(() => {
            // Restore original methods
            document.createElement = originalCreateElement;
            URL.createObjectURL = originalCreateObjectURL;
            URL.revokeObjectURL = originalRevokeObjectURL;
        });

        it('should generate thumbnail from video file', async () => {
            const videoPath = '/videos/test.mp4';
            const outputPath = '/media/thumbnails/test.jpg';

            const result = await generateThumbnail(videoPath, outputPath);

            // The thumbnail generation should succeed with our mocks
            expect(result.success).toBe(true);
            expect(result.blobUrl).toBe('blob:mock-url');

            // Check operations - read video, write thumbnail
            expect(executeOperation).toHaveBeenCalledTimes(3); // createDir, read, write

            // First call is to ensure directory
            expect((executeOperation as jest.Mock).mock.calls[0][1].type).toBe('CREATE_DIRECTORY');

            // Second call should be to read the video file
            expect((executeOperation as jest.Mock).mock.calls[1][1].type).toBe('READ');
            expect((executeOperation as jest.Mock).mock.calls[1][1].path).toBe(videoPath);

            // Third call should be to write the thumbnail
            expect((executeOperation as jest.Mock).mock.calls[2][1].type).toBe('WRITE');
            expect((executeOperation as jest.Mock).mock.calls[2][1].path).toBe(outputPath);
        });

        it('should handle non-browser environment', async () => {
            const cleanup = mockIsBrowser(false);

            try {
                // First clear any mock implementations
                jest.clearAllMocks();

                // Stronger mocking to ensure non-browser environment
                jest.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);

                const videoPath = '/videos/test.mp4';
                const outputPath = '/media/thumbnails/test.jpg';

                // Mock executeOperation to ensure it's not creating stray promises
                (executeOperation as jest.Mock).mockImplementation(() =>
                    Promise.resolve({ success: false })
                );

                const result = await generateThumbnail(videoPath, outputPath);

                // Should fail in non-browser environment
                expect(result.success).toBe(false);
            } finally {
                cleanup();
            }
        });
    });

    describe('ensureThumbnailExists', () => {
        let originalCreateElement: typeof document.createElement;
        let originalCreateObjectURL: typeof URL.createObjectURL;

        beforeEach(() => {
            // Save original methods
            originalCreateElement = document.createElement;
            originalCreateObjectURL = URL.createObjectURL;

            // Setup mocks
            setupThumbnailMocks();

            // Ensure browser environment
            if (global.window === undefined) {
                global.window = {} as any;
            }
        });

        afterEach(() => {
            // Restore original methods
            document.createElement = originalCreateElement;
            URL.createObjectURL = originalCreateObjectURL;
        });

        it('should return placeholder for non-browser environment', async () => {
            const cleanup = mockIsBrowser(false);

            try {
                // Mock the isBrowser function to guarantee it returns false for this test
                // This is a more direct approach to ensure the test works correctly
                jest.spyOn(global, 'window', 'get').mockReturnValue(undefined as any);

                const result = await ensureThumbnailExists('/videos/any.mp4');
                expect(result).toBe('/video_clip.png');
            } finally {
                cleanup();
            }
        });

        it('should generate thumbnail if not found on disk', async () => {
            const videoPath = '/videos/new.mp4';
            const thumbnailPath = getThumbnailPath(videoPath);

            // Override the default mock to simulate missing thumbnail
            (executeOperation as jest.Mock).mockImplementation((_, operation) => {
                if (operation.type === 'READ' && operation.path === thumbnailPath) {
                    throw new Error('File not found');
                }
                if (operation.type === 'READ') {
                    return Promise.resolve({ data: new ArrayBuffer(1024) });
                }
                if (operation.type === 'WRITE' || operation.type === 'CREATE_DIRECTORY') {
                    return Promise.resolve(true);
                }
                return Promise.resolve(null);
            });

            // Call the function under test
            const result = await ensureThumbnailExists(videoPath);

            // Verify the blob URL is returned (success case)
            expect(result).toBe('blob:mock-url');

            // Verify that generateThumbnail was implicitly called
            // by checking if the write operation for the new thumbnail was performed
            const writeCalls = (executeOperation as jest.Mock).mock.calls.filter(
                call => call[1].type === 'WRITE' && call[1].path === thumbnailPath
            );

            expect(writeCalls.length).toBe(1);
        });

        it('should read existing thumbnail if available', async () => {
            const videoPath = '/videos/existing.mp4';
            const thumbnailPath = getThumbnailPath(videoPath);

            // Reset mocks and setup for this test
            jest.clearAllMocks();

            // Return sample data for any read operation
            (executeOperation as jest.Mock).mockImplementation((_, operation) => {
                // Successfully read the thumbnail file
                if (operation.type === 'READ') {
                    return Promise.resolve({ data: new ArrayBuffer(1024) });
                }
                return Promise.resolve(null);
            });

            // Spy on URL.createObjectURL to verify it was called
            URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');

            // Call the function under test
            const result = await ensureThumbnailExists(videoPath);

            // Should return the blob URL
            expect(result).toBe('blob:mock-url');

            // Verify read operation was attempted for the thumbnail path
            const readCalls = (executeOperation as jest.Mock).mock.calls.filter(
                call => call[1].type === 'READ' && call[1].path === thumbnailPath
            );
            expect(readCalls.length).toBeGreaterThan(0);
        });
    });
}); 