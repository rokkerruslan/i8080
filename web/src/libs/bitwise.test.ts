import {clrb, from16, high, low, setb, to16, xorb, setclrb} from "./bitwise"


describe.each([
    [low, 0xab00, 0x00],
    [low, 0xabcd, 0xcd],
    [low, 0xf, 0xf],
    [low, 0xab, 0xab],
    [low, 0xabc, 0xbc],
    [low, 0xffffabcd, 0xcd],

    [high, 0xabcd, 0xab],
    [high, 0xab00, 0xab],
    [high, 0xf, 0],
    [high, 0xab, 0],
    [high, 0xabc, 0xa],
    [high, 0xffffabcd, 0xab],
])("low and high", (func: any, input: any, expected: any) => {
    test("should return correct value", () => {
        expect(func(input)).toBe(expected)
    })
})

describe.each([
    [0xab, 0xcd, 0xabcd],
    [0x1, 0xab, 0x01ab],
    [0xabc, 0xdef, 0xbcef],
])("to16", (high: any, low: any, expected: any) => {
    test("should return correct value", () => {
        expect(to16(high, low)).toBe(expected)
    })
})

describe("from16", () => {
    test("should return correct value of low byte", () => {
        expect(from16(0x00AA)).toEqual([0x00, 0xAA])
    })

    test("should return correct value of high byte", () => {
        expect(from16(0xAA00)).toEqual([0xAA, 0x00])
    })

    test("should ignore bits after 16 point", () => {
        expect(from16(0xABCDE)).toEqual([0xBC, 0xDE])
    })
})

describe.each([
    [0, 0b1],
    [1, 0b10],
    [2, 0b100],
    [3, 0b1000],
    [4, 0b10000],
    [5, 0b100000],
    [6, 0b1000000],
    [7, 0b10000000],
    [8, 0],
])("setb", (bit: any, expected: any) => {
    test("should set correct bit", () => {
        expect(setb(0, bit)).toBe(expected)
    })
})

describe.each([
    [0, 0b10101011],
    [1, 0b10101010],
    [2, 0b10101110],
    [3, 0b10101010],
    [4, 0b10111010],
    [5, 0b10101010],
    [6, 0b11101010],
    [7, 0b10101010],
    [8, 0b10101010],
])("setb", (bit: any, expected: any) => {
    test("should set correct bit without else", () => {
        expect(setb(0xaa, bit)).toBe(expected)
    })
})

describe.each([
    [0, 0b11111110],
    [1, 0b11111101],
    [2, 0b11111011],
    [3, 0b11110111],
    [4, 0b11101111],
    [5, 0b11011111],
    [6, 0b10111111],
    [7, 0b01111111],
    [8, 0b11111111],
])("clrb", (bit: any, expected: any) => {
    test("should clear correct bit", () => {
        expect(clrb(0xff, bit)).toBe(expected)
    })
})

describe.each([
    [0, 0b10101010],
    [1, 0b10101000],
    [2, 0b10101010],
    [3, 0b10100010],
    [4, 0b10101010],
    [5, 0b10001010],
    [6, 0b10101010],
    [7, 0b00101010],
    [8, 0b10101010],
])("clrb", (bit: any, expected: any) => {
    test("should clear correct bit without else", () => {
        expect(clrb(0xaa, bit)).toBe(expected)
    })
})

describe.each([
    [0, 0b10101011],
    [1, 0b10101000],
    [2, 0b10101110],
    [3, 0b10100010],
    [4, 0b10111010],
    [5, 0b10001010],
    [6, 0b11101010],
    [7, 0b00101010],
    [8, 0b10101010],
])("combit", (bit: any, expected: any) => {
    test("should complement correct bit", () => {
        expect(xorb(0xaa, bit)).toBe(expected)
    })
})

describe.each([
    [0b11111111, 0, 0, 0b11111110],
    [0b00000000, 1, 1, 0b00000010],
])("setclrb", (src, bit, cond, expected) => {
    test("should proxy correct", () => {
        expect(setclrb(src, bit, cond)).toBe(expected)
    })
})
