// Return intersection of two sets
let intersection = function <T>(a: Set<T>, b: Set<T>): Set<T> {
    let r = new Set<T>();

    for (let elem of b) if (a.has(elem)) r.add(elem);

    return r;
};

export {intersection};
