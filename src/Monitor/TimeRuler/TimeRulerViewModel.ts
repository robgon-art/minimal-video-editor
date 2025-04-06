import { useMemo, useCallback } from 'react';

// Props for the TimeRuler view
export interface TimeRulerViewProps {
    currentTime: number;
    duration: number;
    progress: number; // 0-100 percentage
    tickMarks: number[];
    onTimeUpdate: (time: number) => void;
    onProgressBarClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// Pure transformation function to generate tick marks
export const generateTickMarks = (duration: number, numTicks: number = 10): number[] => {
    if (duration <= 0) return [];

    const marks: number[] = [];
    const interval = duration / (numTicks - 1);

    for (let i = 0; i < numTicks; i++) {
        marks.push(i * interval);
    }

    return marks;
};

// Pure transformation function
export const createTimeRulerViewProps = (
    currentTime: number,
    duration: number,
    onTimeUpdate: (time: number) => void
): TimeRulerViewProps => {
    // Calculate progress as percentage
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Generate tick marks for the ruler
    const tickMarks = generateTickMarks(duration);

    // Handler for clicking on the progress bar
    const onProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentageClicked = clickX / rect.width;
        const newTime = percentageClicked * duration;

        onTimeUpdate(newTime);
    };

    return {
        currentTime,
        duration,
        progress,
        tickMarks,
        onTimeUpdate,
        onProgressBarClick
    };
};

// ViewModel hook
export const useTimeRulerViewModel = (
    currentTime: number,
    duration: number,
    onTimeUpdate: (time: number) => void
) => {
    return useMemo(
        () => createTimeRulerViewProps(currentTime, duration, onTimeUpdate),
        [currentTime, duration, onTimeUpdate]
    );
}; 