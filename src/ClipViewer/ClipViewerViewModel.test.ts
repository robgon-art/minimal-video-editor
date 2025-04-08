import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipViewerViewModel, createClipViewerProps } from './ClipViewerViewModel';
import { mediaService } from '../services/media/MediaServiceInstance';
import { Clip } from '../Clip/ClipModel';

// Mock the mediaService methods
jest.mock('../services/media/MediaServiceInstance', () => ({
    mediaService: {
        scanMediaFolder: jest.fn(),
        importMediaFiles: jest.fn()
    }
}));

describe('ClipViewerViewModel', () => {
    // Store the original document.createElement method
    const originalCreateElement = document.createElement.bind(document);

    // Store original console.error
    const originalConsoleError = console.error;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Restore the original createElement to its default behavior
        document.createElement = originalCreateElement;

        // Mock console.error to suppress expected error messages
        console.error = jest.fn();
    });

    afterAll(() => {
        // Restore original console.error
        console.error = originalConsoleError;
    });

    describe('createClipViewerProps', () => {
        it('should create view props with the right structure', () => {
            // Arrange
            const sampleClips = [
                {
                    id: '1',
                    title: 'Test Clip 1',
                    thumbnailUrl: '/thumbnails/test1.jpg',
                    mediaUrl: '/media/test1.mp4',
                    duration: 10
                },
                {
                    id: '2',
                    title: 'Test Clip 2',
                    thumbnailUrl: '/thumbnails/test2.jpg',
                    mediaUrl: '/media/test2.mp4',
                    duration: 20
                }
            ];
            const onClipClick = jest.fn();
            const onAddClips = jest.fn();

            // Act
            const props = createClipViewerProps(
                sampleClips,
                false,
                null,
                onClipClick,
                onAddClips
            );

            // Assert
            expect(props).toEqual({
                clips: sampleClips,
                isLoading: false,
                errorMessage: null,
                onClipClick,
                onAddClips
            });
        });
    });

    describe('useClipViewerViewModel', () => {
        it('should load clips on mount', async () => {
            // Setup mockReturnValue before rendering the hook
            const sampleClips = [
                {
                    id: '1',
                    title: 'Test Clip 1',
                    thumbnailUrl: '/thumbnails/test1.jpg',
                    mediaUrl: '/media/test1.mp4',
                    duration: 10
                },
                {
                    id: '2',
                    title: 'Test Clip 2',
                    thumbnailUrl: '/thumbnails/test2.jpg',
                    mediaUrl: '/media/test2.mp4',
                    duration: 20
                }
            ];
            (mediaService.scanMediaFolder as jest.Mock).mockResolvedValue(sampleClips);

            const { result } = renderHook(() => useClipViewerViewModel());

            // Initially should be loading
            expect(result.current.isLoading).toBe(true);

            // Wait for data loading
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Check results
            expect(result.current.clips).toEqual(sampleClips);
            expect(result.current.errorMessage).toBeNull();

            // Verify the service was called
            expect(mediaService.scanMediaFolder).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when loading clips', async () => {
            // Mock a failed API call
            (mediaService.scanMediaFolder as jest.Mock).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for error handling
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Check error state
            expect(result.current.errorMessage).toBe('Failed to load clips from media folder');
        });

        it('should handle clip selection', async () => {
            // Setup the initial state with loaded clips
            const sampleClips = [
                {
                    id: '1',
                    title: 'Test Clip 1',
                    thumbnailUrl: '/thumbnails/test1.jpg',
                    mediaUrl: '/media/test1.mp4',
                    duration: 10
                },
                {
                    id: '2',
                    title: 'Test Clip 2',
                    thumbnailUrl: '/thumbnails/test2.jpg',
                    mediaUrl: '/media/test2.mp4',
                    duration: 20
                }
            ];
            (mediaService.scanMediaFolder as jest.Mock).mockResolvedValue(sampleClips);

            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for data loading
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Select a clip
            act(() => {
                result.current.onClipClick('1');
            });

            // Verify selection
            expect(result.current.clips.find(c => c.id === '1')?.selected).toBe(true);
            expect(result.current.clips.find(c => c.id === '2')?.selected).toBe(false);
        });

        it('should handle adding clips through file dialog', async () => {
            // Create a mock file input that we'll inject
            const mockFileInput = document.createElement('input');
            mockFileInput.type = 'file';
            mockFileInput.multiple = true;
            mockFileInput.accept = 'video/*';

            // Mock click method and store original
            const originalClick = mockFileInput.click;
            mockFileInput.click = jest.fn();

            // Create a mock file
            const mockFiles = [
                new File(['test'], 'test.mp4', { type: 'video/mp4' })
            ];

            // Setup initial clips for scanMediaFolder
            const initialClips = [
                { id: '1', title: 'Existing Clip', thumbnailUrl: '/test.jpg', duration: 30 }
            ];

            // Mock scanMediaFolder to return initial clips
            (mediaService.scanMediaFolder as jest.Mock).mockResolvedValue(initialClips);

            // Setup importMediaFiles mock
            const newClips = [
                { id: '3', title: 'test', thumbnailUrl: '/test.jpg', duration: 45 }
            ];
            (mediaService.importMediaFiles as jest.Mock).mockResolvedValue(newClips);

            // Mock document.createElement only for input element
            jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'input') {
                    return mockFileInput;
                }
                return originalCreateElement(tagName);
            });

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for initial load and ensure clips are loaded
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.clips).toEqual(initialClips);
            });

            // Store initial clips count
            const initialClipsCount = result.current.clips.length;
            expect(initialClipsCount).toBe(1); // Verify we have the expected initial state

            // Trigger add clips function
            act(() => {
                result.current.onAddClips();
            });

            // Verify file input was created and configured correctly
            expect(document.createElement).toHaveBeenCalledWith('input');
            expect(mockFileInput.click).toHaveBeenCalled();

            // Simulate file selection by triggering the onchange event
            await act(async () => {
                const event = {
                    target: {
                        files: mockFiles
                    }
                } as unknown as Event;

                // Directly call the implementation's onchange handler
                if (mockFileInput.onchange) {
                    await mockFileInput.onchange(event);
                }
            });

            // Wait for importMediaFiles to be called and clips to be updated
            await waitFor(() => {
                expect(mediaService.importMediaFiles).toHaveBeenCalled();
                expect(result.current.clips.length).toBe(initialClipsCount + newClips.length);
            });

            // Assert
            expect(mediaService.importMediaFiles).toHaveBeenCalledWith(mockFiles);
            expect(result.current.clips).toContainEqual(newClips[0]);

            // Restore original
            mockFileInput.click = originalClick;
            jest.restoreAllMocks();
        });

        it('should handle errors when adding clips', async () => {
            // Create a real input element
            const mockFileInput = document.createElement('input');
            mockFileInput.type = 'file';
            mockFileInput.click = jest.fn();

            // Setup initial clips
            const initialClips = [
                { id: '1', title: 'Existing Clip', thumbnailUrl: '/test.jpg', duration: 30 }
            ];
            
            // Mock scanMediaFolder to return initial clips
            (mediaService.scanMediaFolder as jest.Mock).mockResolvedValue(initialClips);

            // Setup importMediaFiles to fail
            (mediaService.importMediaFiles as jest.Mock).mockRejectedValue(new Error('Failed to import files'));

            // Mock document.createElement only for input
            jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'input') {
                    return mockFileInput;
                }
                return originalCreateElement(tagName);
            });

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.clips).toEqual(initialClips);
            });

            // Trigger add clips function
            act(() => {
                result.current.onAddClips();
            });

            // Simulate file selection
            await act(async () => {
                // Create a mock file
                const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });

                // Get the onchange handler that was set by the component
                // and manually trigger it with our mock file
                const event = {
                    target: {
                        files: [mockFile]
                    }
                } as unknown as Event;

                if (mockFileInput.onchange) {
                    await mockFileInput.onchange(event);
                }
            });

            // Wait for error to be set
            await waitFor(() => expect(result.current.errorMessage).not.toBeNull());

            // Assert
            expect(result.current.errorMessage).toBe('Failed to add clips');
            
            // Verify clips haven't changed
            expect(result.current.clips).toEqual(initialClips);

            jest.restoreAllMocks();
        });

        it('should handle empty file selection', async () => {
            // Create a real input element
            const mockFileInput = document.createElement('input');
            mockFileInput.type = 'file';
            mockFileInput.click = jest.fn();

            // Setup initial clips
            const initialClips = [
                { id: '1', title: 'Existing Clip', thumbnailUrl: '/test.jpg', duration: 30 }
            ];
            
            // Mock scanMediaFolder to return initial clips
            (mediaService.scanMediaFolder as jest.Mock).mockResolvedValue(initialClips);

            // Mock document.createElement only for input
            jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'input') {
                    return mockFileInput;
                }
                return originalCreateElement(tagName);
            });

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for initial load and ensure clips are loaded
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.clips).toEqual(initialClips);
            });

            // Trigger add clips function
            act(() => {
                result.current.onAddClips();
            });

            // Simulate empty file selection
            await act(async () => {
                // Get the onchange handler that was set by the component
                // and manually trigger it with empty files
                const event = {
                    target: {
                        files: []
                    }
                } as unknown as Event;

                if (mockFileInput.onchange) {
                    await mockFileInput.onchange(event);
                }
            });

            // Assert clips didn't change
            expect(result.current.clips).toEqual(initialClips);

            jest.restoreAllMocks();
        });

        it('should handle file dialog error', async () => {
            // Setup initial clips
            const initialClips = [
                { id: '1', title: 'Existing Clip', thumbnailUrl: '/test.jpg', duration: 30 }
            ];
            
            // Mock scanMediaFolder to return initial clips
            (mediaService.scanMediaFolder as jest.Mock).mockResolvedValue(initialClips);
            
            // Mock document.createElement to throw an error
            jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'input') {
                    throw new Error('Failed to create input');
                }
                return originalCreateElement(tagName);
            });

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.clips).toEqual(initialClips);
            });

            // Trigger add clips function
            act(() => {
                result.current.onAddClips();
            });

            // Assert
            expect(result.current.errorMessage).toBe('Failed to open file dialog');
            
            // Verify clips haven't changed
            expect(result.current.clips).toEqual(initialClips);

            jest.restoreAllMocks();
        });
    });
}); 