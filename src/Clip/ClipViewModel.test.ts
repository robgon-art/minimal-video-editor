import { Clip } from '../models/ClipModel';
import { createClipViewProps } from './ClipViewModel';

describe('ClipViewModel', () => {
    describe('createClipViewProps', () => {
        it('should transform clip model to view props', () => {
            // Arrange
            const mockClip: Clip = {
                id: '123',
                title: 'Test Clip',
                thumbnailUrl: 'https://example.com/image.jpg',
                duration: 30,
                selected: true
            };

            const mockOnClipClick = jest.fn();

            // Act
            const result = createClipViewProps(mockClip, mockOnClipClick);

            // Assert
            expect(result).toEqual({
                title: 'Test Clip',
                thumbnailUrl: 'https://example.com/image.jpg',
                isSelected: true,
                onClick: expect.any(Function)
            });

            // Test click handler
            result.onClick();
            expect(mockOnClipClick).toHaveBeenCalledWith('123');
        });

        it('should handle unselected clip', () => {
            // Arrange
            const mockClip: Clip = {
                id: '456',
                title: 'Another Clip',
                thumbnailUrl: 'https://example.com/another.jpg',
                duration: 20
                // selected is undefined
            };

            const mockOnClipClick = jest.fn();

            // Act
            const result = createClipViewProps(mockClip, mockOnClipClick);

            // Assert
            expect(result.isSelected).toBe(false);
        });
    });
}); 