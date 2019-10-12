import {Rule}from "./scanner"
import {Context, db, ds, dw, evaluate, isString} from "./eval"

test.each([
    ["''", true],
    ["' '", true],
    ["'text'", true],
    ["'Hello, world'", true],
    ["\"", false],
    [" ", false],
    ["Hello, World", false],
    ["'Hello, World", false],
    ["Hello, world'", false],
    ["Hello, 'world'", false],
])("isString", (src: any, want) => {
    expect(isString(src)).toBe(want)
})

describe("evaluate", () => {
    test.each([
        ["1", 1],
        ["0", 0],
        ["-1", -1],
        ["-1000", -1000],
        ["10H", 0x10],
        ["10O", 0o10],
        ["11B", 0b11],
        ["FFFFH", 0xffff],
    ])("numbers", (src: any, want) => {
        expect(evaluate(new Context(), {rule: Rule.Id, lexeme: src, line: 0, start: 0, end: 0})).toBe(want)
    })

    test.each([
        ["'A'", 65],
        ["'я'", 255]
    ])("chars", (src: any, want) => {
        expect(evaluate(new Context(), {lexeme: src, rule: Rule.String, line: 0, start: 0, end: 0})).toBe(want)
    })

    test("too long char", () => {
        expect(() => evaluate(new Context(), {lexeme: "'ab'", rule: Rule.String, line: 0, start: 0, end: 0})).toThrowError("length")
    })

    test("unexisting symbol", () => {
        expect(() => evaluate(new Context(), {
            lexeme: "'π'",
            rule: Rule.String,
            line: 0,
            start: 0,
            end: 0
        })).toThrowError("unexisting symbol")
    })

    test("$ symbol", () => {
        let ctx = new Context()
        ctx.counter = 0xDEADBEAF

        expect(evaluate(ctx, {lexeme: "$", rule: Rule.Id, line: 0, start: 0, end: 0})).toBe(0xDEADBEAF)
    })

    test("check values (SET, EQU)", () => {
        let ctx = new Context()
        ctx.values.set("NEWEQU", 0x10)

        expect(evaluate(ctx, {lexeme: "NEWEQU", rule: Rule.Id, line: 0, start: 0, end: 0})).toBe(0x10)
    })

    test("if lexeme looks as number, it must not be calculated as number, get from values", () => {
        let ctx = new Context()
        ctx.values.set("FFFFH", 0x1)

        expect(evaluate(ctx, {lexeme: "FFFFH", rule: Rule.Id, line: 0, start: 0, end: 0})).toBe(0x1)
    })
})

describe("db dw ds", () => {
    test.each([
        ["1", [1]],
        ["'ABC'", [65, 66, 67]],
    ])("db", (src: any, want) => {
        expect(db(new Context(), {rule: Rule.Id, lexeme: src, line: 0, start: 0, end: 0})).toEqual(want)
    })

    test.each([
        ["02h", [0x02, 0x00]],
        ["3c00h", [0x00, 0x3c]],
        ["3c01h", [0x01, 0x3c]],
    ])("dw", (src: any, want) => {
        expect(dw(new Context(), {rule: Rule.Id, lexeme: src, line: 0, start: 0, end: 0})).toEqual(want)
    })

    test.each([
        ["0", []],
        ["1", [0]],
        ["10", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ])("ds", (src: any, want) => {
        expect(ds(new Context(), {rule: Rule.Id, lexeme: src, line: 0, start: 0, end: 0})).toEqual(want)
    })
})
