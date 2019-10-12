// Additional data structures.

// Stack structure (any size)
class Stack<T> extends Array<T> {
    constructor(initial: Iterable<T> = []) {
        super(...initial)

        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, Stack.prototype)
    }

    pop(): T {
        let value = super.pop()
        if (value === undefined) throw TypeError("pop: Stack is empty")
        return value
    }

    last(): T {
        if (this.length === 0) throw TypeError("last: Stack is empty")
        return this[this.length - 1]
    }

    isEmpty(): boolean {
        return this.length === 0
    }
}


// Dict - key value structure, based on Map object.
class Dict<K, V> {

    // Workaround. Map can't be extended in Chrome today :)
    _map: Map<K, V> = new Map()

    constructor(initial: Iterable<[K, V]> = []) {
        for (const [k, v] of initial) {
            this._map.set(k, v)
        }
    }

    get(key: K, alt?: V): V {
        if (!this._map.has(key)) {
            if (alt === undefined) throw new Error(`key ${key} does not exists`)

            return alt
        }

        return this._map.get(key) as V
    }

    set(k: K, v: V) {
        this._map.set(k, v)
    }

    has(k: K) {
        return this._map.has(k)
    }

    keys() {
        return this._map.keys()
    }

    entries() {
        return this._map.entries()
    }
}

export {Stack, Dict}
