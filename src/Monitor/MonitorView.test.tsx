import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MonitorView from './MonitorView';
import { Clip } from '../Clip/ClipModel';

describe('MonitorView', () => {
    const mockClip: Clip = {
        id: 'test-id',
        title: 'Test Clip',
        thumbnailUrl: 'test-url',
        duration: 60,
        filePath: 'test-file-path'
    };

    const mockOnProgressBarClick = jest.fn();

    const defaultProps = {
        title: 'Test Monitor',
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
            onProgressBarClick: mockOnProgressBarClick
        },
        transportControlProps: {
            isPlaying: false,
            onPlayPauseClick: jest.fn(),
            onStepForwardClick: jest.fn(),
            onStepBackwardClick: jest.fn()
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<MonitorView {...defaultProps} />);

        expect(screen.getByTestId('monitor-test monitor')).toBeInTheDocument();
        expect(screen.getByText('Test Monitor')).toBeInTheDocument();
    });

    it('handles drag and drop of a clip', () => {
        // Create a mock drop handler
        const mockDropClip = jest.fn();

        render(<MonitorView {...defaultProps} onDropClip={mockDropClip} />);

        // Get the monitor element
        const monitorElement = screen.getByTestId('monitor-test monitor');

        // Create a mock drop event
        const clipJson = JSON.stringify(mockClip);
        const mockDataTransfer = {
            getData: jest.fn((format) => {
                if (format === 'application/json') {
                    return clipJson;
                }
                return '';
            })
        };

        // Simulate a dragover event
        fireEvent.dragOver(monitorElement, {
            preventDefault: jest.fn()
        });

        // Simulate a drop event
        fireEvent.drop(monitorElement, {
            preventDefault: jest.fn(),
            dataTransfer: mockDataTransfer
        });

        // Verify the drop handler was called with the clip data
        expect(mockDropClip).toHaveBeenCalledTimes(1);
        expect(mockDropClip).toHaveBeenCalledWith(mockClip);
    });
}); 