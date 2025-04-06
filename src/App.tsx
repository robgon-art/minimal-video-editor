import React, { useEffect } from 'react';
import './App.css';
import EditorView from './Editor/EditorView';
import { useEditorViewModel } from './Editor/EditorViewModel';
import { fileSystem } from './services/storage/FileSystem';

const App: React.FC = () => {
  // Use the editor view model to get props
  const editorProps = useEditorViewModel();

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Close DB connection when App component unmounts
      fileSystem.closeDB();
    };
  }, []);

  return (
    <div className="app">
      <EditorView {...editorProps} />
    </div>
  );
};

export default App;
