import {accumulate, chain, count} from "./itertools"

describe("count", () => {
    test("count start value", () => {
        expect(count(0).next().value).toEqual(0)
    })

    test("count cycle", () => {
        let c = count(0)

        expect(c.next().value).toBe(0)
        expect(c.next().value).toBe(1)
        expect(c.next().value).toBe(2)
        expect(c.next().value).toBe(3)
    })

    test("count cycle with step", () => {
        let c = count(1, 2)

        expect(c.next().value).toBe(1)
        expect(c.next().value).toBe(3)
        expect(c.next().value).toBe(5)
        expect(c.next().value).toBe(7)
    })
})

describe("accumulate", () => {
    test("empty arg", () => {
        expect([...accumulate([])]).toEqual([])
    })

    test("accumulate with default func", () => {
        expect([...accumulate([1, 2, 3, 4, 5])]).toEqual([1, 3, 6, 10, 15])
    })

    test("accumulate with specific func", () => {
        expect([...accumulate([1, 2, 3], (a: number, b: number) => a * b)]).toEqual([1, 2, 6])
    })
})

describe("chain", () => {
    test("empty chain must have zero length", () => {
        expect([...chain()]).toEqual([])
    })

    test("chain", () => {
        expect([...chain([1], [2, 3, 4], [5, 6, 7, 8])]).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })
})
