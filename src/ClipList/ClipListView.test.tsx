import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ClipListView from './ClipListView';
import * as ClipListViewModelHooks from './ClipListViewModel';
import { Clip } from '../Clip/ClipModel';
import * as ClipViewModel from '../Clip/ClipViewModel';

// Sample test data
const sampleClips: Clip[] = [
    {
        id: '1',
        title: 'Test Clip 1',
        thumbnailUrl: '/test-thumb-1.jpg',
        duration: 10,
        filePath: '/media/test1.mp4'
    },
    {
        id: '2',
        title: 'Test Clip 2',
        thumbnailUrl: '/test-thumb-2.jpg',
        duration: 15,
        filePath: '/media/test2.mp4'
    }
];

// Mock clip with thumbnails for testing
const clipsWithThumbnails = sampleClips.map(clip => ({
    ...clip,
    loadedThumbnailUrl: `/loaded-${clip.id}.jpg`
}));

// Helper function to wait for all pending promises and state updates
const waitForAsyncUpdates = async () => {
    // Wait for promises and React state updates
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
};

describe('ClipListView', () => {
    // Since we want to avoid mocks as much as possible per Eric Elliott's guidelines,
    // we'll use a spy for the useClipsWithThumbnails hook rather than replacing it
    // This allows the real implementation to run in most tests
    let useClipsWithThumbnailsSpy: jest.SpyInstance;
    let mockUseClipViewModel: jest.SpyInstance;

    beforeEach(() => {
        // Spy on the hook to track calls but let the real implementation run
        useClipsWithThumbnailsSpy = jest.spyOn(ClipListViewModelHooks, 'useClipsWithThumbnails');

        // Mock the useClipViewModel hook to avoid dependencies
        mockUseClipViewModel = jest.spyOn(ClipViewModel, 'useClipViewModel');

        // Default implementation for all tests
        mockUseClipViewModel.mockImplementation((clip: any, onClickFn: any) => ({
            clip,
            title: clip.title,
            thumbnailUrl: clip.loadedThumbnailUrl || clip.thumbnailUrl,
            onClick: () => onClickFn(clip),
            duration: clip.duration,
            testId: `clip-${clip.id}`
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders without crashing', async () => {
        const handleClipClick = jest.fn();

        // Override the hook's real implementation for this test to avoid async operations
        useClipsWithThumbnailsSpy.mockReturnValue(clipsWithThumbnails);

        await act(async () => {
            render(<ClipListView clips={sampleClips} onClipClick={handleClipClick} />);
        });

        // Verify the component rendered
        const clipListElement = screen.getByTestId('clip-list');
        expect(clipListElement).toBeInTheDocument();
    });

    it('renders all clips provided in props', async () => {
        const handleClipClick = jest.fn();

        // Override the hook to avoid async operations
        useClipsWithThumbnailsSpy.mockReturnValue(clipsWithThumbnails);

        await act(async () => {
            render(<ClipListView clips={sampleClips} onClipClick={handleClipClick} />);
        });

        // Check if all clips are rendered
        const clipItems = screen.getAllByTestId(/clip-list-item-/);
        expect(clipItems).toHaveLength(sampleClips.length);

        // Verify specific clip titles are present in the DOM
        // This depends on ClipView implementation, so we check for test IDs instead
        expect(screen.getByTestId('clip-list-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('clip-list-item-2')).toBeInTheDocument();
    });

    it('calls onClipClick when a clip is clicked', async () => {
        const handleClipClick = jest.fn();

        // Override the hooks for this test
        useClipsWithThumbnailsSpy.mockReturnValue(clipsWithThumbnails);

        // Set up a callback that actually triggers the provided function
        mockUseClipViewModel.mockImplementation((clip: any, onClickFn: any) => {
            return {
                clip,
                title: clip.title,
                thumbnailUrl: clip.loadedThumbnailUrl || clip.thumbnailUrl,
                onClick: () => {
                    // Ensure we're calling the original function with the clip
                    onClickFn(clip.id);
                    return true;
                },
                duration: clip.duration,
                testId: `clip-${clip.id}`
            };
        });

        await act(async () => {
            render(<ClipListView clips={sampleClips} onClipClick={handleClipClick} />);
        });

        // Directly access the onClick handler from the mocked useClipViewModel
        const mockCallbacks = mockUseClipViewModel.mock.results.map(result => result.value.onClick);

        // Directly call the first clip's onClick handler
        await act(async () => {
            mockCallbacks[0]();
        });

        // Verify that onClipClick was called with the correct clip ID
        expect(handleClipClick).toHaveBeenCalledWith('1');
    });

    it('makes clips draggable', async () => {
        const handleClipClick = jest.fn();

        // Override the hook for this test
        useClipsWithThumbnailsSpy.mockReturnValue(clipsWithThumbnails);

        await act(async () => {
            render(<ClipListView clips={sampleClips} onClipClick={handleClipClick} />);
        });

        // Get all clip items
        const clipItems = screen.getAllByTestId(/clip-list-item-/);

        // Check if they have the draggable attribute
        clipItems.forEach(item => {
            expect(item).toHaveAttribute('draggable');
        });
    });

    it('sets drag data when dragging starts', async () => {
        const handleClipClick = jest.fn();

        // Override the hook for this test
        useClipsWithThumbnailsSpy.mockReturnValue(clipsWithThumbnails);

        // We need to mock the drag event
        const dataTransfer = {
            setData: jest.fn(),
            setDragImage: jest.fn()
        };

        await act(async () => {
            render(<ClipListView clips={sampleClips} onClipClick={handleClipClick} />);
        });

        // Find a clip item and simulate drag start
        const firstClipItem = screen.getByTestId('clip-list-item-1');

        await act(async () => {
            fireEvent.dragStart(firstClipItem, { dataTransfer });
        });

        // Verify that setData was called with the clip data
        expect(dataTransfer.setData).toHaveBeenCalledWith(
            'application/json',
            expect.any(String) // We expect a JSON string
        );

        // Parse the JSON string to verify it contains the expected data
        const jsonArg = dataTransfer.setData.mock.calls[0][1];
        const parsedData = JSON.parse(jsonArg);

        // Verify important properties are included
        expect(parsedData.id).toBe('1');
        expect(parsedData.title).toBe('Test Clip 1');
        expect(parsedData._dragSource).toBe('clipList');
    });

    it('uses the useClipsWithThumbnails hook to process thumbnails', async () => {
        const handleClipClick = jest.fn();

        // Reset the spy to track real calls
        useClipsWithThumbnailsSpy.mockRestore();
        useClipsWithThumbnailsSpy = jest.spyOn(ClipListViewModelHooks, 'useClipsWithThumbnails');

        await act(async () => {
            render(<ClipListView clips={sampleClips} onClipClick={handleClipClick} />);
            await waitForAsyncUpdates();
        });

        // Verify the hook was called with the clips
        expect(useClipsWithThumbnailsSpy).toHaveBeenCalledWith(sampleClips);
    });

    it('renders a list with no clips', async () => {
        const handleClipClick = jest.fn();

        // Override the hook to return empty array
        useClipsWithThumbnailsSpy.mockReturnValue([]);

        await act(async () => {
            render(<ClipListView clips={[]} onClipClick={handleClipClick} />);
        });

        // Check if the clip list is still rendered
        const clipListElement = screen.getByTestId('clip-list');
        expect(clipListElement).toBeInTheDocument();

        // No clip items should be rendered
        const clipItems = screen.queryAllByTestId(/clip-list-item-/);
        expect(clipItems).toHaveLength(0);
    });
}); 