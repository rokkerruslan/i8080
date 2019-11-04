import {from16} from "@/libs/bitwise"
import {Dict} from "@/libs/collections"
import {Ascii, iscan} from "@/libs/strings"

import {Token} from "./scanner"
import {AssemblerError} from "./errors"

export {evaluate, db, dw, ds, Context, isString}

const isString = (s: string): boolean => s.startsWith("'") && s.endsWith("'")

// Evaluate value of token lexeme
//
// todo: tests on big number in evaluation
// We are not change lexeme here.
const evaluate = (c: Context, t: Token, defer = false): number => {
    const lexeme = t.lexeme

    if (lexeme === "$") return c.counter

    if (isString(lexeme)) {
        const char = lexeme.slice(1, -1)

        if (char.length !== 1) throw new AssemblerError("char length MUST be one", t)

        const index = Ascii.indexOf(char)

        if (index < 0) {
            throw new AssemblerError(`unexisting symbol ${lexeme}`, t)
        }

        return index
    }

    // if can parse like number it's a number
    // else if match like label, try get label
    // if label does not exists, put it to unresolved
    // At ends of assembly try to resolve all labels, if
    // can't to resolve, raise error on unresolved token

    // todo: label regex
    if (lexeme.match(/^\D\w*/)) {
        const val = c.values.get(lexeme, c.addrs.get(lexeme, -1))
        if (val >= 0) {
            return val
        }

        if (defer) {
            c.unresolved.set(t, c.counter)
            return 0
        }
    }

    try {
        return iscan(lexeme)
    } catch (e) {
        throw new AssemblerError(`can't find ${lexeme} value`, t)
    }
}

// db evaluate "db" assemble pseudo instruction
// Result will be one byte number.
const db = (c: Context, t: Token): Array<number> => {
    if (isString(t.lexeme)) {
        return t.lexeme.slice(1, -1).split("").map(c => {
            const i = Ascii.indexOf(c)
            if (i < 0) {
                throw new AssemblerError(`undefined symbol ${c}`, t)
            }
            return i
        })
    }

    const v = evaluate(c, t)

    if (v > Math.pow(2, 8)) {
        throw new AssemblerError(`too big value ${t.lexeme} for one byte`, t)
    }

    return [v]
}

// dw evaluate "dw" assemble pseudo instruction
// Result will be two bytes number.
const dw = (c: Context, t: Token): Array<number> => {
    const v = evaluate(c, t)

    if (v > Math.pow(2, 16)) {
        throw new AssemblerError(`too big value ${t.lexeme} for 2 bytes`, t)
    }

    return from16(v).reverse()
}

// ds evaluate "DS" assemble pseudo instruction
const ds = (c: Context, t: Token) => {
    const v = evaluate(c, t)

    if (v > Math.pow(2, 16)) {
        throw new AssemblerError(`too big value ${t.lexeme} for 2 bytes`, t)
    }

    return Array.from({length: v}, () => 0)
}

// Context
//
// Collect information about evaluation.
class Context {
    // Assembler position in binary file
    counter: number

    // SET and EQU values dictionary. Assembler
    // before start set the predefined register
    // names to values dict, analog of "B:  SET 0",
    // etc instructions as start of source code.
    values: Dict<string, number>

    // Resolved labels (label -> address)
    addrs: Dict<string, number>

    // Unresolved labels, we need the Token type
    // for generating errors if name will not be
    // resolved at the end of assembling.
    unresolved: Dict<Token, number>

    constructor() {
        this.counter = 0
        this.values = Resisters.copy()
        this.addrs = new Dict<string, number>()
        this.unresolved = new Dict<Token, number>()
    }
}

const Resisters = new Dict([
    ["B", 0b000],
    ["C", 0b001],
    ["D", 0b010],
    ["E", 0b011],
    ["H", 0b100],
    ["L", 0b101],
    ["M", 0b110],
    ["A", 0b111],
    ["PSW", 0b111],
    ["SP", 0b111],
])

// todo: support expressions
// noinspection JSUnusedLocalSymbols
const Operations = new Dict([
    ["+", (a: number, b: number = NaN) => isNaN(b) ? +a : a + b],
    ["-", (a: number, b: number = NaN) => isNaN(b) ? -a : a - b],
    ["*", (a: number, b: number) => a * b],
    ["/", (a: number, b: number) => a / b | 0],
    ["mod", (a: number, b: number) => a % b],
    ["not", (a: number) => ~a],
    ["and", (a: number, b: number) => a & b],
    ["or", (a: number, b: number) => a | b],
    ["xor", (a: number, b: number) => a ^ b],
    ["shr", (a: number, b: number) => a >>> b],
    ["shl", (a: number, b: number) => a << b],
])
