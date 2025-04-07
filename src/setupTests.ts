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

// Mock HTMLMediaElement for video testing
if (typeof window !== 'undefined') {
  // Store the original properties
  const originalDescriptors = Object.getOwnPropertyDescriptors(HTMLMediaElement.prototype);

  // Create a mock state object to store the mock values
  const mockMediaState = new WeakMap<HTMLMediaElement, {
    paused: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
  }>();

  // Get or initialize state
  const getState = (element: HTMLMediaElement) => {
    if (!mockMediaState.has(element)) {
      mockMediaState.set(element, {
        paused: true,
        currentTime: 0,
        duration: 100,
        volume: 1,
        muted: false
      });
    }
    return mockMediaState.get(element)!;
  };

  // Override the properties with our mock implementations
  Object.defineProperties(HTMLMediaElement.prototype, {
    paused: {
      configurable: true,
      get(this: HTMLMediaElement) {
        return getState(this).paused;
      }
    },
    currentTime: {
      configurable: true,
      get(this: HTMLMediaElement) {
        return getState(this).currentTime;
      },
      set(this: HTMLMediaElement, value: number) {
        getState(this).currentTime = value;
      }
    },
    duration: {
      configurable: true,
      get(this: HTMLMediaElement) {
        return getState(this).duration;
      },
      set(this: HTMLMediaElement, value: number) {
        getState(this).duration = value;
      }
    },
    volume: {
      configurable: true,
      get(this: HTMLMediaElement) {
        return getState(this).volume;
      },
      set(this: HTMLMediaElement, value: number) {
        getState(this).volume = value;
      }
    },
    muted: {
      configurable: true,
      get(this: HTMLMediaElement) {
        return getState(this).muted;
      },
      set(this: HTMLMediaElement, value: boolean) {
        getState(this).muted = value;
      }
    }
  });

  // Mock methods
  HTMLMediaElement.prototype.play = jest.fn(function (this: HTMLMediaElement) {
    getState(this).paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });

  HTMLMediaElement.prototype.pause = jest.fn(function (this: HTMLMediaElement) {
    getState(this).paused = true;
    this.dispatchEvent(new Event('pause'));
  });

  HTMLMediaElement.prototype.load = jest.fn();
}

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
  'FileSystem.ts',
  // Add specific test-generated errors that we expect
  'Test error', // From our mock rejection
  '[TEST_EXPECTED_ERROR]', // Special marker for errors we expect in tests
  'Storage error' // From our catch block
];

// Prevent specific errors from cluttering test output
const originalConsoleError = console.error;
console.error = (...args) => {
  // Special handling for test environment
  if (process.env.NODE_ENV === 'test') {
    // Convert args to string for checking
    const errorMessage = JSON.stringify(args);

    // Check if any of our patterns match the error message
    if (errorPatternsToFilter.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase()))) {
      // Silently ignore expected test errors
      return;
    }

    // Special handling for Error objects
    for (const arg of args) {
      if (arg instanceof Error && arg.message.includes('[TEST_EXPECTED_ERROR]')) {
        return; // Ignore errors with our test marker
      }
      if (arg && typeof arg === 'object' && arg.stack &&
        (String(arg.stack).includes('[TEST_EXPECTED_ERROR]') ||
          String(arg.message).includes('[TEST_EXPECTED_ERROR]'))) {
        return; // Ignore error-like objects with our test marker
      }
    }
  }

  // Show all other errors normally
  originalConsoleError(...args);
};

// Also filter console.log messages related to thumbnail generation
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only filter in test environment
  if (process.env.NODE_ENV === 'test') {
    // Convert args to string for checking
    const logMessage = JSON.stringify(args).toLowerCase();

    // Filter out thumbnail-related logs and our debugging logs
    if (
      logMessage.includes('thumbnail') ||
      logMessage.includes('reading video file') ||
      logMessage.includes('ensuring') ||
      logMessage.includes('directory') ||
      logMessage.includes('generating') ||
      // Add our debug emoji markers
      logMessage.includes('🔍') || // Reading from storage
      logMessage.includes('✅') || // Success
      logMessage.includes('❌') || // Error
      logMessage.includes('⚠️') || // Warning
      logMessage.includes('🧹') || // Cleanup
      logMessage.includes('🎬')    // Video creation
    ) {
      // Skip these logs in tests
      return;
    }
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
