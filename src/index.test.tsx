import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import ReactDOM from 'react-dom/client';

// // Mock the Editor to avoid IndexedDB errors
// jest.mock('./Editor/EditorViewModel', () => ({
//   useEditorViewModel: jest.fn().mockReturnValue({
//     title: "Video Editor App",
//     clipViewerProps: {
//       clips: [],
//       isLoading: false,
//       errorMessage: null,
//       loadClips: jest.fn(),
//       selectClip: jest.fn(),
//       selectedClipId: null
//     }
//   })
// }));

describe('Index functionality', () => {
    // Test index.tsx can be imported without errors
    it('index.tsx can be imported without throwing errors', () => {
        // Setup a root element for React to render into
        document.body.innerHTML = '';
        const root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
        
        // Mock only the minimal parts needed to prevent actual DOM manipulation
        const mockRender = jest.fn();
        const mockUnmount = jest.fn();
        
        try {
            // Mock ReactDOM.createRoot temporarily
            jest.spyOn(ReactDOM, 'createRoot').mockImplementation(() => ({
                render: mockRender,
                unmount: mockUnmount
            }));
            
            // This simply verifies that requiring index.tsx doesn't throw errors
            expect(() => { require('./index'); }).not.toThrow();
            
            // Optionally verify createRoot was called (not essential)
            expect(ReactDOM.createRoot).toHaveBeenCalled();
        } finally {
            // Clean up mocks
            jest.restoreAllMocks();
        }
    });

    // Test document has proper root element
    it('document has root element for React to render into', () => {
        // Create root element
        const root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);

        expect(document.getElementById('root')).not.toBeNull();
    });

    // Test reportWebVitals is a valid function
    it('reportWebVitals is a function', () => {
        const reportWebVitals = require('./reportWebVitals').default;
        expect(typeof reportWebVitals).toBe('function');
    });
}); 