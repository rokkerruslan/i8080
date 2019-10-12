import {intersection} from "@/libs/shortcuts"

describe("intersection", () => {
    test("different sets", () => {
        const a = new Set([1, 3, 5])
        const b = new Set([0, 2, 4])

        expect(intersection(a, b)).toEqual(new Set())
    })

    test("intersection sets", () => {
        const a = new Set([1, 2, 3, 4])
        const b = new Set([1, 2, 4, 8])

        expect(intersection(a, b)).toEqual(new Set([1, 2, 4]))
    })

    test("full intersection sets", () => {
        const a = new Set([5, 4, 3, 2, 1])
        const b = new Set([1, 2, 3, 4, 5])

        expect(intersection(a, b)).toEqual(new Set([1, 2, 3, 4, 5]))
    })
})
