import { generateTickMarks, createTimeRulerViewProps } from './TimeRulerViewModel';

describe('TimeRulerViewModel', () => {
    const mockOnTimeUpdate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateTickMarks', () => {
        it('should generate correct tick marks for a given duration', () => {
            const tickMarks = generateTickMarks(100, 5);
            expect(tickMarks).toEqual([0, 25, 50, 75, 100]);
        });

        it('should generate 10 tick marks by default', () => {
            const tickMarks = generateTickMarks(90);
            expect(tickMarks.length).toBe(10);
            expect(tickMarks[0]).toBe(0);
            expect(tickMarks[9]).toBe(90);
        });

        it('should return empty array for zero or negative duration', () => {
            expect(generateTickMarks(0)).toEqual([]);
            expect(generateTickMarks(-10)).toEqual([]);
        });
    });

    describe('createTimeRulerViewProps', () => {
        it('should create props with correct progress percentage', () => {
            const props = createTimeRulerViewProps(30, 100, mockOnTimeUpdate);
            expect(props.progress).toBe(30); // 30/100 * 100 = 30%
        });

        it('should handle zero duration without errors', () => {
            const props = createTimeRulerViewProps(10, 0, mockOnTimeUpdate);
            expect(props.progress).toBe(0);
            expect(props.tickMarks).toEqual([]);
        });

        it('should create onProgressBarClick handler that calls onTimeUpdate', () => {
            const props = createTimeRulerViewProps(30, 100, mockOnTimeUpdate);
            
            // Mock event with getBoundingClientRect
            const mockEvent = {
                currentTarget: {
                    getBoundingClientRect: () => ({
                        left: 0,
                        width: 200
                    })
                },
                clientX: 100 // Middle of the 200px width bar
            } as any;
            
            props.onProgressBarClick(mockEvent);
            
            // Should call onTimeUpdate with time at 50% of duration
            expect(mockOnTimeUpdate).toHaveBeenCalledWith(50);
        });
    });
}); 