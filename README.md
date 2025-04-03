# Minimal Video Editor

A React TypeScript application for video editing using MVVM architecture, functional programming principles, and highly testable code.

## Architecture

This application is built using MVVM (Model-View-ViewModel) architecture with a focus on loose coupling and high testability:

- **Model**: Represents data structures and operations (src/models/)
- **View**: Pure presentational components that receive props and render UI (src/\*/\*View.tsx)
- **ViewModel**: Manages state and business logic using React hooks (src/\*/\*ViewModel.ts)

## Key Features

- **Loosely coupled components**: Each component can be developed and tested in isolation
- **Functional Programming**: Using pure functions for business logic and data transformations
- **Minimal Mocking**: The architecture allows for testing without complex mocks
- **Separation of Concerns**: Clear boundaries between UI, logic, and data

## Folder Structure

```
/src
  /Clip           # Individual clip component
  /ClipList       # List of clips component
  /ClipViewer     # Container for clips and controls
  /Editor         # Top-level editor component
  /models         # Data models and services
  /utils          # Utility functions
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Run tests:
   ```
   npm test
   ```

## Testing Strategy

The application follows a testing approach that minimizes mocking:

- **ViewModel Tests**: Test logic and state independently of React components
- **View Tests**: Shallow tests for presentational components using props only
- **Model Tests**: Test data handling logic in isolation

## Contributing

1. Follow the existing architecture patterns
2. Write tests for new functionality
3. Use pure functions where appropriate
4. Maintain loose coupling between components
