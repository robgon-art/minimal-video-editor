// Utility for function composition (right to left)
export const compose = <T>(...fns: Array<(arg: T) => T>) =>
    (value: T): T => fns.reduceRight((acc, fn) => fn(acc), value);

// Utility for function composition (left to right)
export const pipe = <T>(...fns: Array<(arg: T) => T>) =>
    (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

// Utility for creating a function that applies transformations to an object
export const evolve = <T extends object>(transformations: Partial<{ [K in keyof T]: (value: T[K]) => any }>) =>
    (obj: T): T => {
        const result = { ...obj };
        for (const key in transformations) {
            if (Object.prototype.hasOwnProperty.call(transformations, key)) {
                const transform = transformations[key];
                if (transform && key in obj) {
                    result[key] = transform(obj[key]);
                }
            }
        }
        return result;
    };

// Memoize a function (simple version)
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();

    return ((...args: any[]) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    }) as T;
};

// Curry a function
export const curry = <T extends (...args: any[]) => any>(fn: T) => {
    const arity = fn.length;

    return function curried(...args: any[]): any {
        if (args.length >= arity) {
            return fn(...args);
        }

        return (...moreArgs: any[]) => curried(...args, ...moreArgs);
    };
};

// Debounce a function
export const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, ms);
    };
}; 