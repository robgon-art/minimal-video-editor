import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Define types to match the application
interface Clip {
  id: string;
  name: string;
  path: string;
  duration: number;
}

// Only mock the view model to provide stable data
jest.mock('./ClipViewer/ClipViewerViewModel', () => {
  return {
    useClipViewerViewModel: () => ({
      clips: [
        { id: 'sample1', name: 'Sample 1', path: '/media/sample1.mp4', duration: 30 },
        { id: 'sample2', name: 'Sample 2', path: '/media/sample2.mov', duration: 45 },
      ],
      isLoading: false,
      errorMessage: null,
      loadClips: jest.fn().mockResolvedValue(undefined),
      selectClip: jest.fn(),
      selectedClipId: null
    })
  };
});

// A simpler test that focuses just on what we can reliably test
test('renders video editor app', () => {
  render(<App />);

  // Check for the app title - this is the main thing we can reliably test
  const titleElement = screen.getByText(/Video Editor App/i);
  expect(titleElement).toBeInTheDocument();
});
