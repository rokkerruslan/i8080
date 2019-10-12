// itertools - analog python itertools implementation

let add = (a: number, b: number): number => {
    return a + b
};

// Make an iterator that returns evently spaced values with number start.
// Example:
//    count(1) -> 1 2 3 4 5 ...
//    count(1, 0.2) -> 1 1.2 1.4 1.6 ...
//    count(10, -1) -> 10 9 8 7 ...
//
// Infinite generator
//
export function* count(start: number, step: number = 1): IterableIterator<number> {
    while (true) {
        yield start;
        start += step;
    }
}

type Iter<T> = IterableIterator<T> | Array<T>;

let iter = <T>(i: Iter<T>): IterableIterator<T> => {
    if (i instanceof Array) return i[Symbol.iterator]();

    return i;
};

export function* accumulate<T>(i: Iter<T>, f: CallableFunction = add): IterableIterator<T> {
    i = iter(i);

    let t = i.next();

    if (t.done) return;

    let total = t.value;

    yield total;

    for (const el of i) {
        total = f(total, el);
        yield total;
    }
}

export function* chain<T>(...iters: Array<Iter<T>>): IterableIterator<T> {
    for (const it of iters) {
        for (const el of it) {
            yield el;
        }
    }
}
