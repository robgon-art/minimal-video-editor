import {
    StorageAdapter,
    extractVideoDuration,
    executeOperation,
    executeWriteWithMetadata
} from './IOEffects';
import {
    Operation,
    OperationType,
    WriteOperation,
    createWriteOperation
} from '../../services/storage/StorageOperations';

// Increase timeout for all tests in this file
jest.setTimeout(10000);

// Create a simple mock URL for test
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

describe('IOEffects', () => {
    // Create a simple in-memory adapter that we can use for tests instead of mocking
    class InMemoryStorageAdapter implements StorageAdapter {
        storage: Map<string, ArrayBuffer> = new Map();
        operationHistory: Operation[] = [];

        async executeOperation(operation: Operation): Promise<any> {
            this.operationHistory.push(operation);

            switch (operation.type) {
                case OperationType.READ:
                    const data = this.storage.get(operation.path);
                    if (!data) {
                        throw new Error(`File not found: ${operation.path}`);
                    }
                    return data;

                case OperationType.WRITE:
                    const writeOp = operation as WriteOperation;
                    this.storage.set(operation.path, writeOp.data);
                    return true;

                case OperationType.DELETE:
                    const deleted = this.storage.delete(operation.path);
                    return deleted;

                case OperationType.LIST:
                    return Array.from(this.storage.keys()).filter(key =>
                        key.startsWith(operation.path));

                case OperationType.CREATE_DIRECTORY:
                    // Directories don't need explicit creation in memory
                    return true;

                default:
                    // Type assertion to avoid the 'never' type error
                    const unknownOp = operation as { type: string };
                    throw new Error(`Unsupported operation: ${unknownOp.type}`);
            }
        }
    }

    describe('executeOperation', () => {
        it('should execute operations using the adapter', async () => {
            // Arrange
            const adapter = new InMemoryStorageAdapter();
            const data = new ArrayBuffer(10);
            const operation = createWriteOperation('/test.mp4', data);

            // Act
            const result = await executeOperation<boolean>(adapter, operation);

            // Assert
            expect(result).toBe(true);
            expect(adapter.storage.get('/test.mp4')).toBe(data);
            expect(adapter.operationHistory.length).toBe(1);
            expect(adapter.operationHistory[0]).toBe(operation);
        });

        it('should propagate errors from the adapter', async () => {
            // Arrange
            const adapter = new InMemoryStorageAdapter();

            // Using a valid Operation type with invalid path to trigger an error
            const operation: Operation = {
                type: OperationType.READ,
                path: '/nonexistent.mp4'
            };

            // Spy on console.error to prevent it from showing in test output
            jest.spyOn(console, 'error').mockImplementation(() => { });

            // Act & Assert
            await expect(executeOperation(adapter, operation))
                .rejects.toThrow('File not found: /nonexistent.mp4');
        });
    });

    describe('extractVideoDuration', () => {
        beforeEach(() => {
            // Create a minimal video element mock
            const mockVideoElement = {
                onloadedmetadata: null as any,
                onerror: null as any,
                duration: 42,
                src: ''
            };

            // Mock document.createElement to return our video element
            document.createElement = jest.fn().mockImplementation((tagName) => {
                if (tagName === 'video') {
                    return mockVideoElement;
                }
                return {};
            });
        });

        it('should extract the duration from a video buffer', async () => {
            // Arrange
            const buffer = new ArrayBuffer(10);

            // Act
            const durationPromise = extractVideoDuration(buffer);

            // Simulate the metadata loading
            const video = document.createElement('video') as any;
            video.onloadedmetadata();

            // Assert
            const duration = await durationPromise;
            expect(duration).toBe(42);
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalled();
        });

        it('should return 0 when metadata loading fails', async () => {
            // Arrange
            const buffer = new ArrayBuffer(10);

            // Act
            const durationPromise = extractVideoDuration(buffer);

            // Simulate an error
            const video = document.createElement('video') as any;
            video.onerror();

            // Assert
            const duration = await durationPromise;
            expect(duration).toBe(0);
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalled();
        });
    });

    describe('executeWriteWithMetadata', () => {
        let adapter: InMemoryStorageAdapter;

        beforeEach(() => {
            adapter = new InMemoryStorageAdapter();

            // Create a minimal video element mock with a fixed duration
            const mockVideoElement = {
                onloadedmetadata: null as any,
                onerror: null as any,
                duration: 30,
                src: ''
            };

            // Mock document.createElement to return our video element
            document.createElement = jest.fn().mockImplementation((tagName) => {
                if (tagName === 'video') {
                    return mockVideoElement;
                }
                return {};
            });
        });

        it('should extract metadata and execute write operation', async () => {
            // Arrange
            const buffer = new ArrayBuffer(1024);
            const operation = createWriteOperation('/video.mp4', buffer);

            // Setup mock to make the test pass by immediately triggering onloadedmetadata
            jest.spyOn(global.URL, 'createObjectURL').mockImplementation(() => {
                // Immediately trigger the metadata load event
                setTimeout(() => {
                    const video = document.createElement('video') as any;
                    if (video.onloadedmetadata) {
                        video.onloadedmetadata();
                    }
                }, 0);
                return 'blob:test-url';
            });

            // Act
            const metadata = await executeWriteWithMetadata(adapter, operation);

            // Assert
            expect(adapter.storage.get('/video.mp4')).toBe(buffer);
            expect(metadata).toEqual({
                size: 1024,
                lastModified: expect.any(Date),
                durationInSeconds: 30
            });
        });
    });
}); 