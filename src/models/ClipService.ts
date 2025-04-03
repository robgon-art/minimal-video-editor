import { Clip } from './ClipModel';
import { v4 as uuidv4 } from 'uuid';

// Sample data (would be from an API in a real app)
const sampleClips: Clip[] = [
    {
        id: '1',
        title: 'Intro Sequence',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Intro',
        duration: 10
    },
    {
        id: '2',
        title: 'Main Scene',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Main',
        duration: 45
    },
    {
        id: '3',
        title: 'Credits',
        thumbnailUrl: 'https://via.placeholder.com/150?text=Credits',
        duration: 15
    }
];

// Pure functions that simulate API calls
export const fetchClips = async (): Promise<Clip[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...sampleClips];
};

export const createClip = async (title: string): Promise<Clip> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const newClip: Clip = {
        id: uuidv4(),
        title,
        thumbnailUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(title)}`,
        duration: Math.floor(Math.random() * 30) + 5 // Random duration between 5-35 seconds
    };

    return newClip;
};

// We could add more service methods like deleteClip, updateClip, etc. 