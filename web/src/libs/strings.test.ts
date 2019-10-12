import {Format, ifmt, iscan} from "@/libs/strings"

describe("ifmt", () => {
    test.each([
        [0, Format.Bin, "0B"],
        [1, Format.Bin, "1B"],
        [2, Format.Bin, "10B"],
        [12, Format.Bin, "1100B"],
        [123, Format.Bin, "1111011B"],

        [0, Format.Dec, "0"],
        [1, Format.Dec, "1"],
        [2, Format.Dec, "2"],
        [12, Format.Dec, "12"],
        [123, Format.Dec, "123"],

        [0, Format.Oct, "0O"],
        [1, Format.Oct, "1O"],
        [2, Format.Oct, "2O"],
        [12, Format.Oct, "14O"],
        [123, Format.Oct, "173O"],

        [0, Format.Hex, "0H"],
        [1, Format.Hex, "1H"],
        [2, Format.Hex, "2H"],
        [12, Format.Hex, "CH"],
        [123, Format.Hex, "7BH"],

        [0, Format.Ascii, "NUL"],
    ])("should returns correct content", (n: any, format: any, expected) => {
        expect(ifmt(n, format)).toBe(expected)
    })

    test.each([
        [-12, "1B"],
        [-1, "1B"],
        [0, "1B"],
        [1, "1B"],
        [2, "01B"],
        [12, "000000000001B"],
    ])("should set correct padding length", (width: any, expected) => {
        expect(ifmt(1, Format.Bin, width)).toBe(expected)
    })

    test("trying convert big number as ascii", () => {
        expect(() => ifmt(256, Format.Ascii)).toThrowError("ascii")
    })
})

describe("iscan", () => {
    test("must not accept empty string", () => {
        expect(() => iscan("")).toThrowError("empty")
    })

    test.each([
        [" "],
        ["\t"],
        ["\r"],
        ["\n"],
    ])("must not accept empty string with spaces", s => {
        expect(() => iscan(s)).toThrowError("empty")
    })

    test.each([
        ["10b", "10B"],
        ["77o", "77O"],
        ["AcH", "aCh"],
    ])("must be case insensitive", (s, s2) => {
        expect(iscan(s)).toBe(iscan(s2))
    })

    test.each([
        [" AH"],
        ["AH "],
        ["\tAH"],
        ["AH\t"],
        [" AH "],
        ["\nAH"],
        ["AH\n"],
    ])("must ignore trailing/leading spaces", s => {
        expect(iscan(s)).toBe(0xA)
    })

    test.each([
        ["1010B", 0b1010],
        ["7070O", 0o7070],
        ["1010", 1010],
        ["1010H", 0x1010],
    ])("must return correct value", (text: any, expected) => {
        expect(iscan(text)).toBe(expected)
    })

    test("must parse hex with letters", () => {
        expect(iscan("ACDCH")).toBe(0xACDC)
    })

    test.each([
        ["H"],     // just 16-bit postfix
        ["O"],     // just 8-bit postfix
        ["B"],     // just 2-bit postfix
    ])("must raise if value contains only postfix", s => {
        expect(() => iscan(s)).toThrowError("prefix")
    })

    test.each([
        ["TEXT"],  // just example incorrect text
        ["A"],     // valid symbol but without postfix
    ])("must raise if value is incorrect", s => {
        expect(() => iscan(s)).toThrowError("is not a number")
    })

    test.each([
        ["2B"],
        ["8O"],
        ["GH"],
    ])("must raise if set of numbers incorrect for target system", s => {
        expect(() => iscan(s)).toThrowError("is not a number")
    })

    test.each([
        ["A", 0x41],
        ["NUL", 0x00]
    ])("must parse ascii chars", (s: any, want) => {
        expect(iscan(s, true)).toBe(want)
    })

    test("trying decode non ascii symbol as ascii", () => {
        expect(() => iscan("LOL", true)).toThrowError("ascii")
    })
})
