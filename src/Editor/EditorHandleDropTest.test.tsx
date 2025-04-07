import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorView from './EditorView';
import { EditorViewProps } from './EditorViewModel';
import { Clip } from '../Clip/ClipModel';

describe('Editor Drag and Drop', () => {
    // Mock clip for testing
    const mockClip: Clip = {
        id: 'test-clip-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-thumbnail.jpg',
        duration: 60,
        filePath: 'test-file-path'
    };

    // Mock props for the editor component
    const createMockProps = (onDropClip = jest.fn()): EditorViewProps => ({
        title: 'Test Editor',
        clipViewerProps: {
            clips: [mockClip],
            isLoading: false,
            errorMessage: null,
            onClipClick: jest.fn(),
            onAddClips: jest.fn()
        },
        sourceMonitorProps: {
            title: 'Source',
            currentClip: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            videoPanelProps: {
                clip: null,
                currentTime: 0,
                timecode: '00:00:00:00'
            },
            timeRulerProps: {
                currentTime: 0,
                duration: 0,
                progress: 0,
                tickMarks: [],
                onTimeUpdate: jest.fn(),
                onProgressBarClick: jest.fn()
            },
            transportControlProps: {
                isPlaying: false,
                onPlayPauseClick: jest.fn(),
                onStepForwardClick: jest.fn(),
                onStepBackwardClick: jest.fn()
            },
            onDropClip
        },
        programMonitorProps: {
            title: 'Program',
            currentClip: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            videoPanelProps: {
                clip: null,
                currentTime: 0,
                timecode: '00:00:00:00'
            },
            timeRulerProps: {
                currentTime: 0,
                duration: 0,
                progress: 0,
                tickMarks: [],
                onTimeUpdate: jest.fn(),
                onProgressBarClick: jest.fn()
            },
            transportControlProps: {
                isPlaying: false,
                onPlayPauseClick: jest.fn(),
                onStepForwardClick: jest.fn(),
                onStepBackwardClick: jest.fn()
            }
        }
    });

    it('renders the editor with source and program monitors', () => {
        render(<EditorView {...createMockProps()} />);
        
        expect(screen.getByText('Test Editor')).toBeInTheDocument();
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('Program')).toBeInTheDocument();
    });

    it('calls onDropClip when a clip is dropped on the source monitor', () => {
        const mockOnDropClip = jest.fn();
        render(<EditorView {...createMockProps(mockOnDropClip)} />);
        
        // Find the source monitor
        const sourceMonitor = screen.getByTestId('monitor-source');
        
        // Prepare the drag event data
        const clipJson = JSON.stringify(mockClip);
        const mockDataTransfer = {
            getData: jest.fn((format) => {
                if (format === 'application/json') {
                    return clipJson;
                }
                return '';
            })
        };
        
        // Trigger drop event
        fireEvent.drop(sourceMonitor, {
            preventDefault: jest.fn(),
            dataTransfer: mockDataTransfer
        });
        
        // Check if the drop handler was called with the clip
        expect(mockOnDropClip).toHaveBeenCalledTimes(1);
        expect(mockOnDropClip).toHaveBeenCalledWith(mockClip);
    });
}); 