import { compose, pipe, evolve, memoize, curry, debounce } from './functional';

describe('functional utilities', () => {
    describe('compose', () => {
        it('should compose functions from right to left', () => {
            const add2 = (x: number) => x + 2;
            const multiply3 = (x: number) => x * 3;
            const subtract5 = (x: number) => x - 5;

            const composed = compose(subtract5, multiply3, add2);

            // Execution order: add2 -> multiply3 -> subtract5
            // For input 10: (10 + 2) = 12, (12 * 3) = 36, (36 - 5) = 31
            expect(composed(10)).toBe(31);
        });

        it('should return the identity function when no functions are provided', () => {
            const identity = compose();
            expect(identity(42)).toBe(42);
        });

        it('should work with a single function', () => {
            const double = (x: number) => x * 2;
            const composed = compose(double);
            expect(composed(5)).toBe(10);
        });
    });

    describe('pipe', () => {
        it('should compose functions from left to right', () => {
            const add2 = (x: number) => x + 2;
            const multiply3 = (x: number) => x * 3;
            const subtract5 = (x: number) => x - 5;

            const piped = pipe(add2, multiply3, subtract5);

            // Execution order: add2 -> multiply3 -> subtract5
            // For input 10: (10 + 2) = 12, (12 * 3) = 36, (36 - 5) = 31
            expect(piped(10)).toBe(31);
        });

        it('should return the identity function when no functions are provided', () => {
            const identity = pipe();
            expect(identity(42)).toBe(42);
        });

        it('should work with a single function', () => {
            const double = (x: number) => x * 2;
            const piped = pipe(double);
            expect(piped(5)).toBe(10);
        });
    });

    describe('evolve', () => {
        it('should apply transformations to object properties', () => {
            const obj = {
                name: 'john',
                age: 30,
                active: false
            };

            const transformations = {
                name: (s: string) => s.toUpperCase(),
                age: (n: number) => n + 1,
                active: (b: boolean) => !b
            };

            const evolved = evolve(transformations)(obj);

            expect(evolved).toEqual({
                name: 'JOHN',
                age: 31,
                active: true
            });

            // Original should be unchanged (immutability)
            expect(obj).toEqual({
                name: 'john',
                age: 30,
                active: false
            });
        });

        it('should only transform properties with corresponding transformations', () => {
            const obj = {
                name: 'john',
                age: 30,
                active: false
            };

            const transformations = {
                name: (s: string) => s.toUpperCase()
            };

            const evolved = evolve(transformations)(obj);

            expect(evolved).toEqual({
                name: 'JOHN',
                age: 30,
                active: false
            });
        });

        it('should handle empty transformations', () => {
            const obj = { name: 'john', age: 30 };
            const evolved = evolve({})(obj);
            expect(evolved).toEqual(obj);
            expect(evolved).not.toBe(obj); // Should be a new object (immutability)
        });
    });

    describe('memoize', () => {
        it('should cache function results', () => {
            let callCount = 0;
            const expensiveCalculation = (n: number) => {
                callCount++;
                return n * 2;
            };

            const memoizedFn = memoize(expensiveCalculation);

            // First call - should execute the function
            expect(memoizedFn(5)).toBe(10);
            expect(callCount).toBe(1);

            // Second call with same argument - should use cached result
            expect(memoizedFn(5)).toBe(10);
            expect(callCount).toBe(1); // Still 1, didn't call the original function

            // Different argument - should execute the function again
            expect(memoizedFn(10)).toBe(20);
            expect(callCount).toBe(2);
        });

        it('should cache results based on all arguments', () => {
            let callCount = 0;
            const add = (a: number, b: number) => {
                callCount++;
                return a + b;
            };

            const memoizedAdd = memoize(add);

            expect(memoizedAdd(1, 2)).toBe(3);
            expect(callCount).toBe(1);

            expect(memoizedAdd(1, 2)).toBe(3);
            expect(callCount).toBe(1); // Same args, use cache

            expect(memoizedAdd(2, 1)).toBe(3);
            expect(callCount).toBe(2); // Different args, call function
        });
    });

    describe('curry', () => {
        it('should curry a function with multiple arguments', () => {
            const add = (a: number, b: number, c: number) => a + b + c;
            const curriedAdd = curry(add);

            // Full application
            expect(curriedAdd(1, 2, 3)).toBe(6);

            // Partial application
            const add1 = curriedAdd(1);
            const add1And2 = add1(2);
            expect(add1And2(3)).toBe(6);

            // Mixed application
            expect(curriedAdd(1)(2, 3)).toBe(6);
        });

        it('should work with single argument functions', () => {
            const double = (x: number) => x * 2;
            const curriedDouble = curry(double);

            expect(curriedDouble(5)).toBe(10);
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        it('should delay function execution', () => {
            const mockFn = jest.fn();
            const debounced = debounce(mockFn, 1000);

            debounced();
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(999);
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should reset the timer on subsequent calls', () => {
            const mockFn = jest.fn();
            const debounced = debounce(mockFn, 1000);

            debounced();
            jest.advanceTimersByTime(500);

            debounced(); // Reset the timer
            jest.advanceTimersByTime(500); // 1000ms haven't passed since the second call
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(500); // Now 1000ms have passed since the second call
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to the debounced function', () => {
            const mockFn = jest.fn();
            const debounced = debounce(mockFn, 1000);

            debounced('test', 123);
            jest.advanceTimersByTime(1000);

            expect(mockFn).toHaveBeenCalledWith('test', 123);
        });
    });
}); 