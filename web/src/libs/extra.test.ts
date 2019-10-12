import {isFloat, isInteger, isString, range} from "./extra"

describe("predicates", () => {
    test("float", () => {
        expect(isFloat(.1)).toBeTruthy()
    })

    test("non-float", () => {
        expect(isFloat(1)).toBeFalsy()
    })

    test("integer", () => {
        expect(isInteger(1)).toBeTruthy()
    })

    test("non-integer", () => {
        expect(isInteger(.1)).toBeFalsy()
    })

    test("isString positive", () => {
        expect(isString("asd")).toBe(true)
    })

    test.each([
        NaN,
        0,
        undefined,
        {},
        [],
        Symbol("symbol"),
    ])("isString negative", (val: any) => {
        expect(isString(val)).toBe(false)
    })
})

describe("range", () => {
    test.each([
        [-999, []],
        [-1, []],
        [0, []],
        [1, [0]],
        [2, [0, 1]],
        [3, [0, 1, 2]],
        [4, [0, 1, 2, 3]],
    ])("should returns correct array content", (stop: any, expected: any) => {
        expect(range(stop)).toEqual(expected)
    })

    test("stop can't be float", () => {
        expect(() => range(1.1)).toThrowError(/float/)
    })
})
