import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipViewerViewModel, createClipViewerProps } from './ClipViewerViewModel';
import { scanMediaFolder, importMediaFiles } from '../services/media/MediaScanner';
import { Clip } from '../Clip/ClipModel';

// Mock dependencies to avoid real file system operations
jest.mock('../services/media/MediaScanner', () => ({
    scanMediaFolder: jest.fn(),
    importMediaFiles: jest.fn()
}));

describe('ClipViewerViewModel', () => {
    // Store the original document.createElement method
    const originalCreateElement = document.createElement.bind(document);
    
    // Store original console.error
    const originalConsoleError = console.error;
    
    beforeEach(() => {
        // Reset mock implementation before each test
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
        it('should create view props correctly', () => {
            // Arrange
            const mockClips: Clip[] = [
                { id: '1', title: 'Clip 1', thumbnailUrl: '/clip1.jpg', duration: 30 },
                { id: '2', title: 'Clip 2', thumbnailUrl: '/clip2.jpg', duration: 60 }
            ];
            const mockOnClipClick = jest.fn();
            const mockOnAddClips = jest.fn();

            // Act
            const result = createClipViewerProps(
                mockClips,
                false,
                null,
                mockOnClipClick,
                mockOnAddClips
            );

            // Assert
            expect(result).toEqual({
                clips: mockClips,
                isLoading: false,
                errorMessage: null,
                onClipClick: mockOnClipClick,
                onAddClips: mockOnAddClips
            });
        });
    });

    describe('useClipViewerViewModel', () => {
        beforeEach(() => {
            // Setup default mock implementation for scanMediaFolder
            (scanMediaFolder as jest.Mock).mockResolvedValue([
                { id: '1', title: 'Test Clip', thumbnailUrl: '/test.jpg', duration: 30 }
            ]);
        });

        it('should load clips on mount', async () => {
            // Arrange
            const mockClips = [
                { id: '1', title: 'Test Clip', thumbnailUrl: '/test.jpg', duration: 30 }
            ];
            (scanMediaFolder as jest.Mock).mockResolvedValue(mockClips);

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Initial state should be loading
            expect(result.current.isLoading).toBe(true);

            // Wait for the useEffect to complete
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Assert
            expect(scanMediaFolder).toHaveBeenCalledTimes(1);
            expect(result.current.clips).toEqual(mockClips);
            expect(result.current.errorMessage).toBeNull();
        });

        it('should handle errors when loading clips', async () => {
            // Arrange
            (scanMediaFolder as jest.Mock).mockRejectedValue(new Error('Failed to load'));

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for the useEffect to complete
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Assert
            expect(scanMediaFolder).toHaveBeenCalledTimes(1);
            expect(result.current.clips).toEqual([]);
            expect(result.current.errorMessage).toBe('Failed to load clips from media folder');
        });

        it('should select clip when onClipClick is called', async () => {
            // Arrange
            const mockClips = [
                { id: '1', title: 'Clip 1', thumbnailUrl: '/clip1.jpg', duration: 30 },
                { id: '2', title: 'Clip 2', thumbnailUrl: '/clip2.jpg', duration: 60 }
            ];
            (scanMediaFolder as jest.Mock).mockResolvedValue(mockClips);

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for the useEffect to complete
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Call the clip click handler
            act(() => {
                result.current.onClipClick('2');
            });

            // Assert the clips were updated
            expect(result.current.clips[1].selected).toBe(true);
            expect(result.current.clips[0].selected).toBe(false);
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
            
            // Setup importMediaFiles mock
            const newClips = [
                { id: '3', title: 'test', thumbnailUrl: '/test.jpg', duration: 45 }
            ];
            (importMediaFiles as jest.Mock).mockResolvedValue(newClips);

            // Mock document.createElement only for input element
            jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'input') {
                    return mockFileInput;
                }
                return originalCreateElement(tagName);
            });

            // Act
            const { result } = renderHook(() => useClipViewerViewModel());

            // Wait for initial load
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Initial clips
            const initialClipsCount = result.current.clips.length;

            // Trigger add clips function
            act(() => {
                result.current.onAddClips();
            });

            // Verify file input was created and configured correctly
            expect(document.createElement).toHaveBeenCalledWith('input');
            expect(mockFileInput.click).toHaveBeenCalled();

            // Simulate file selection by triggering the onchange event
            await act(async () => {
                // Get the onchange handler that was set by the component
                // and manually trigger it with our mock files
                const event = {
                    target: { 
                        files: mockFiles
                    }
                } as unknown as Event;
                
                // Find the onchange handler set by the component
                mockFileInput.dispatchEvent(new Event('change'));
                
                // Directly call the implementation's onchange handler
                if (mockFileInput.onchange) {
                    await mockFileInput.onchange(event);
                }
            });

            // Wait for importMediaFiles to be called
            await waitFor(() => expect(importMediaFiles).toHaveBeenCalled());

            // Assert
            expect(importMediaFiles).toHaveBeenCalledWith(mockFiles);
            expect(result.current.clips.length).toBe(initialClipsCount + newClips.length);
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

            // Setup importMediaFiles to fail
            (importMediaFiles as jest.Mock).mockRejectedValue(new Error('Failed to import files'));

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
            await waitFor(() => expect(result.current.isLoading).toBe(false));

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
            
            jest.restoreAllMocks();
        });

        it('should handle empty file selection', async () => {
            // Create a real input element
            const mockFileInput = document.createElement('input');
            mockFileInput.type = 'file'; 
            mockFileInput.click = jest.fn();

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
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Get initial state
            const initialClips = [...result.current.clips];

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
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Trigger add clips function
            act(() => {
                result.current.onAddClips();
            });

            // Assert
            expect(result.current.errorMessage).toBe('Failed to open file dialog');
            
            jest.restoreAllMocks();
        });
    });
}); 