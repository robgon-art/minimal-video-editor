import React from 'react';
import { ClipViewProps } from './ClipViewModel';

// Pure presentational component - receives all data via props
const ClipView: React.FC<ClipViewProps> = ({
    title,
    thumbnailUrl,
    isSelected,
    onClick
}) => {
    return (
        <div
            className={`clip ${isSelected ? 'clip-selected' : ''}`}
            onClick={onClick}
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