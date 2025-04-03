import React from 'react';
import { EditorViewProps } from './EditorViewModel';
import ClipViewerView from '../ClipViewer/ClipViewerView';

// Pure presentational component
const EditorView: React.FC<EditorViewProps> = ({ title, clipViewerProps }) => {
    return (
        <div className="editor" data-testid="editor">
            <header className="editor-header">
                <h1>{title}</h1>
            </header>
            <main className="editor-main">
                <ClipViewerView {...clipViewerProps} />
                <div className="editor-workspace">
                    {/* Additional editor components would go here */}
                    {/* Timeline, preview window, etc. */}
                </div>
            </main>
        </div>
    );
};

export default EditorView; 