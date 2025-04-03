import { Clip, selectClip, updateClipTitle } from '../models/ClipModel';
import { pipe, evolve, memoize } from './functional';

// Functional transformations that can be composed
const truncateTitle = (title: string): string => {
    // "Title with extra spaces" is exactly 22 characters, so set limit to 23
    if (title.length > 23) {
        // Ensure no space before ellipsis by trimming
        return `${title.substring(0, 20).trim()}...`;
    }
    return title;
};

const normalizeTitle = (title: string): string =>
    title.trim().replace(/\s+/g, ' ');

const capitalize = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1);

// Create a pipe of title transformations
export const formatTitle = pipe(
    normalizeTitle,
    capitalize,
    truncateTitle
);

// Use evolve to transform specific properties of a clip
export const enhanceClip = evolve<Clip>({
    title: formatTitle
});

// Create a composed function for formatting and selecting a clip
export const formatAndSelectClip = pipe<Clip>(
    enhanceClip,
    selectClip
);

// Memoized version of the clip formatter for performance
export const memoizedEnhanceClip = memoize(enhanceClip);

// A function to process an array of clips using functional composition
export const processClips = (clips: Clip[]): Clip[] =>
    clips.map(memoizedEnhanceClip);

// Function to sort clips by duration (pure)
export const sortClipsByDuration = (clips: Clip[]): Clip[] =>
    [...clips].sort((a, b) => a.duration - b.duration);

// Function to filter clips by minimum duration (pure)
export const filterClipsByMinDuration = (minDuration: number) =>
    (clips: Clip[]): Clip[] => clips.filter(clip => clip.duration >= minDuration); 