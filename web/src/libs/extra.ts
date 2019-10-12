let isFloat = (num: number): boolean => num % 1 !== 0;

let isInteger = (num: number): boolean => num % 1 === 0;

let isString = (value: any) => Object.prototype.toString.call(value) === "[object String]";

// Return sequence of number from `0` to `stop`;
// If `stop` is zero or negative returns empty array.
//
// @param stop Right bound
//
// @example
// range(10)  // returns "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]"
//
// @example
// range(-10)  // returns "[]"
//
// @example
// range(0)  // returns "[]"
let range = (stop: number) => {
    if (isFloat(stop)) throw new Error("stop must not be float");

    return stop <= -1 ? [] : [...Array(stop).keys()];
};

let range2 = (start: number, stop: number) => {
    return stop <= 1 ? [] : [...Array(stop + start).keys()].slice(start)
}

let count = <I>(t: I, sequence: Iterable<I>): number => {
    let i = 0
    for (const el of sequence) if (t === el) i++
    return i
}

export {isFloat, isInteger, range, range2, isString, count}
