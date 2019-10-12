import {d, r, s, upZSPC} from "@/emulator/shortcuts"
import {Flags} from "@/emulator/tables"

describe("extract opcode values", () => {
    test("extract destination", () => {
        expect(d(0b10101111)).toBe(0b101)

        expect(d(0b01010111)).toBe(0b10)
    })

    test("extract source", () => {
        expect(s(0b10111010)).toBe(0b10)

        expect(s(0b01111101)).toBe(0b101)
    })

    test("extract rp", () => {
        expect(r(0b11101111)).toBe(0b10)

        expect(r(0b11011111)).toBe(0b1)
    })
})

describe("flags", () => {
    const df = 2 // default flags value

    test("zero flag positive", () => {
        expect(upZSPC(df, 0) & Flags.Zero).toBe(Flags.Zero)
    })

    test("zero flag negative", () => {
        expect(upZSPC(df, 1) & Flags.Zero).toBe(0)
    })
})
