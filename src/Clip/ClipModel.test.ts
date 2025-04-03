import { 
  Clip, 
  selectClip, 
  deselectClip, 
  updateClipTitle, 
  selectClipById, 
  getSelectedClips, 
  getTotalDuration,
  addClip,
  addClips,
  clipExists
} from './ClipModel';

describe('ClipModel', () => {
  // Sample clips for testing
  const sampleClips: Clip[] = [
    {
      id: '1',
      title: 'Test Clip 1',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      duration: 10
    },
    {
      id: '2',
      title: 'Test Clip 2',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      duration: 20
    },
    {
      id: '3',
      title: 'Test Clip 3',
      thumbnailUrl: 'https://example.com/thumb3.jpg',
      duration: 30,
      selected: true
    }
  ];

  describe('selectClip', () => {
    it('should mark a clip as selected', () => {
      const clip = sampleClips[0];
      const result = selectClip(clip);
      
      expect(result).not.toBe(clip); // Should return a new object
      expect(result.selected).toBe(true);
      expect(result.id).toBe(clip.id);
    });
  });

  describe('deselectClip', () => {
    it('should mark a clip as not selected', () => {
      const clip = { ...sampleClips[2] }; // Already selected
      const result = deselectClip(clip);
      
      expect(result).not.toBe(clip); // Should return a new object
      expect(result.selected).toBe(false);
      expect(result.id).toBe(clip.id);
    });
  });

  describe('updateClipTitle', () => {
    it('should update the title of a clip', () => {
      const clip = sampleClips[0];
      const newTitle = 'Updated Title';
      const result = updateClipTitle(clip, newTitle);
      
      expect(result).not.toBe(clip); // Should return a new object
      expect(result.title).toBe(newTitle);
      expect(result.id).toBe(clip.id);
    });
  });

  describe('selectClipById', () => {
    it('should select a clip by ID and deselect others', () => {
      const result = selectClipById(sampleClips, '2');
      
      expect(result).not.toBe(sampleClips); // Should return a new array
      expect(result[0].selected).toBe(false);
      expect(result[1].selected).toBe(true);
      expect(result[2].selected).toBe(false);
    });
  });

  describe('getSelectedClips', () => {
    it('should return only selected clips', () => {
      const result = getSelectedClips(sampleClips);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });
  });

  describe('getTotalDuration', () => {
    it('should calculate the total duration of all clips', () => {
      const result = getTotalDuration(sampleClips);
      
      expect(result).toBe(60); // 10 + 20 + 30
    });
  });

  describe('addClip', () => {
    it('should add a new clip to the collection', () => {
      const newClip: Clip = {
        id: '4',
        title: 'New Clip',
        thumbnailUrl: 'https://example.com/thumb4.jpg',
        duration: 15
      };
      
      const result = addClip(sampleClips, newClip);
      
      expect(result).not.toBe(sampleClips); // Should return a new array
      expect(result).toHaveLength(4);
      expect(result[3]).toBe(newClip);
    });
  });

  describe('addClips', () => {
    it('should add multiple clips to the collection', () => {
      const newClips: Clip[] = [
        {
          id: '4',
          title: 'New Clip 1',
          thumbnailUrl: 'https://example.com/thumb4.jpg',
          duration: 15
        },
        {
          id: '5',
          title: 'New Clip 2',
          thumbnailUrl: 'https://example.com/thumb5.jpg',
          duration: 25
        }
      ];
      
      const result = addClips(sampleClips, newClips);
      
      expect(result).not.toBe(sampleClips); // Should return a new array
      expect(result).toHaveLength(5);
      expect(result[3]).toBe(newClips[0]);
      expect(result[4]).toBe(newClips[1]);
    });
  });

  describe('clipExists', () => {
    it('should return true if a clip with the given title exists', () => {
      const result = clipExists(sampleClips, 'Test Clip 2');
      
      expect(result).toBe(true);
    });

    it('should return false if no clip with the given title exists', () => {
      const result = clipExists(sampleClips, 'Nonexistent Clip');
      
      expect(result).toBe(false);
    });

    it('should be case-insensitive', () => {
      const result = clipExists(sampleClips, 'TEST CLIP 1');
      
      expect(result).toBe(true);
    });
  });
}); 