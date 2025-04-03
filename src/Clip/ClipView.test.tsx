import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClipView from './ClipView';
import { ClipViewProps } from './ClipViewModel';

describe('ClipView', () => {
    const createProps = (overrides: Partial<ClipViewProps> = {}): ClipViewProps => ({
        title: 'Test Clip',
        thumbnailUrl: 'https://example.com/image.jpg',
        isSelected: false,
        onClick: jest.fn(),
        ...overrides
    });

    it('should render with title and thumbnail', () => {
        // Arrange
        const props = createProps();

        // Act
        render(<ClipView {...props} />);

        // Assert
        expect(screen.getByText('Test Clip')).toBeInTheDocument();
        expect(screen.getByAltText('Test Clip')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should apply selected class when isSelected is true', () => {
        // Arrange
        const props = createProps({ isSelected: true });

        // Act
        render(<ClipView {...props} />);

        // Assert
        expect(screen.getByTestId('clip-item')).toHaveClass('clip-selected');
    });

    it('should not apply selected class when isSelected is false', () => {
        // Arrange
        const props = createProps({ isSelected: false });

        // Act
        render(<ClipView {...props} />);

        // Assert
        expect(screen.getByTestId('clip-item')).not.toHaveClass('clip-selected');
    });

    it('should call onClick when clicked', () => {
        // Arrange
        const mockOnClick = jest.fn();
        const props = createProps({ onClick: mockOnClick });

        // Act
        render(<ClipView {...props} />);
        fireEvent.click(screen.getByTestId('clip-item'));

        // Assert
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
}); 