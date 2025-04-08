import React from 'react';
import './App.css';
import EditorView from './Editor/EditorView';
import { useEditorViewModel } from './Editor/EditorViewModel';

const App: React.FC = () => {
  // Use the editor view model to get props
  const editorProps = useEditorViewModel();

  return (
    <div className="app">
      <EditorView {...editorProps} />
    </div>
  );
};

export default App;
