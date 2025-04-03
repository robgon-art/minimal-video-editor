import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders video editor app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Video Editor App/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders video clips section', () => {
  render(<App />);
  const clipsElement = screen.getByText(/Video Clips/i);
  expect(clipsElement).toBeInTheDocument();
});
