import { useMemo } from 'react';
import { useClipViewerViewModel } from '../ClipViewer/ClipViewerViewModel';

// Props for the Editor view
export interface EditorViewProps {
    title: string;
    clipViewerProps: ReturnType<typeof useClipViewerViewModel>;
}

// Pure transformation function
export const createEditorViewProps = (
    title: string,
    clipViewerProps: ReturnType<typeof useClipViewerViewModel>
): EditorViewProps => ({
    title,
    clipViewerProps
});

// ViewModel hook
export const useEditorViewModel = () => {
    const clipViewerProps = useClipViewerViewModel();

    // App title can be dynamic based on various states if needed
    const title = "Video Editor App";

    return useMemo(() =>
        createEditorViewProps(title, clipViewerProps),
        [title, clipViewerProps]
    );
}; 