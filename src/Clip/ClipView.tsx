import React from 'react';
import { ClipViewProps } from './ClipViewModel';

// Pure presentational component - receives all data via props
const ClipView: React.FC<ClipViewProps> = ({
    title,
    thumbnailUrl,
    isSelected,
    onClick
}) => {
    // Add a debug wrapper to ensure click is being detected
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        console.log('ClipView clicked:', title);
        onClick(); // Call the provided onClick handler
    };

    return (
        <div
            className={`clip ${isSelected ? 'clip-selected' : ''}`}
            onClick={handleClick}
            data-testid="clip-item"
        >
            <div className="clip-thumbnail">
                <img src={thumbnailUrl} alt={title} />
            </div>
            <div className="clip-title">{title}</div>
        </div>
    );
};

export default ClipView; 