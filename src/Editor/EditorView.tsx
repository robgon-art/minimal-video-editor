import React from 'react';
import { EditorViewProps } from './EditorViewModel';
import ClipViewerView from '../ClipViewer/ClipViewerView';
import MonitorView from '../Monitor/MonitorView';
import './Editor.css';

// Pure presentational component
const EditorView: React.FC<EditorViewProps> = ({
    title,
    clipViewerProps,
    sourceMonitorProps,
    programMonitorProps
}) => {
    return (
        <div className="editor" data-testid="editor">
            <header className="editor-header">
                <h1>{title}</h1>
            </header>
            <main className="editor-main">
                <div className="editor-left-panel">
                    <ClipViewerView {...clipViewerProps} />
                </div>
                <div className="editor-workspace">
                    <div className="monitor-container">
                        <MonitorView {...sourceMonitorProps} />
                        <MonitorView {...programMonitorProps} />
                    </div>
                    <div className="timeline-container">
                        {/* Timeline will go here in future implementation */}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditorView; 