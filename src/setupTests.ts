// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Basic test configuration
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
});

// Create a more complete IndexedDB mock
class IDBMockRequest {
  result = null;
  error = null;
  onupgradeneeded: any = null;
  onsuccess: any = null;
  onerror: any = null;

  constructor() {
    setTimeout(() => {
      if (typeof this.onsuccess === 'function') {
        this.onsuccess({ target: this });
      }
    }, 0);
  }
}

// Mock indexedDB - create a better mock that won't throw errors when properties are set
global.indexedDB = {
  open: jest.fn().mockImplementation(() => new IDBMockRequest()),
  deleteDatabase: jest.fn().mockImplementation(() => new IDBMockRequest()),
  cmp: jest.fn(),
  databases: jest.fn().mockResolvedValue([]),
} as any;

// Create a list of error patterns to filter out
const errorPatternsToFilter = [
  'indexedDB is not defined',
  'IndexedDB',
  'IDBFactory',
  'Error in thumbnail generation',
  'Failed to load thumbnail',
  'Cannot set properties of undefined',
  'Error reading file',
  'Error executing READ operation',
  'Error stack:',
  'Failed to generate thumbnail',
  'is not a function',
  'cannot read properties of undefined',
  'FileSystem.ts'
];

// Prevent specific errors from cluttering test output
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out known errors related to IndexedDB or storage operations
  const errorMessage = JSON.stringify(args).toLowerCase();

  // Check if any of our patterns match the error message
  if (errorPatternsToFilter.some(pattern =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase()))) {
    // Silently ignore these errors
    return;
  }

  // Show all other errors normally
  originalConsoleError(...args);
};

// Also filter console.log messages related to thumbnail generation
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Convert args to string for checking
  const logMessage = JSON.stringify(args).toLowerCase();

  // Filter out thumbnail-related logs
  if (
    logMessage.includes('thumbnail') ||
    logMessage.includes('reading video file') ||
    logMessage.includes('ensuring') ||
    logMessage.includes('directory') ||
    logMessage.includes('generating')
  ) {
    // Skip these logs
    return;
  }

  // Show other logs
  originalConsoleLog(...args);
};

// Mock localStorage and sessionStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true
  });
}

// Mock URL methods used in the code
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = jest.fn(() => 'mock://test-url');
  global.URL.revokeObjectURL = jest.fn();
}
