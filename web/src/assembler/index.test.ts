import {assemble} from "./index"

describe("assembler smoke tests", () => {
    test("smoke test", () => {
        const text = `
            HLT
        `

        expect(assemble(text).text.slice(0, 1)).toEqual([
            0b01110110,
        ])
    })

    // for understanding tests below see assembler/opcodes/Opcodes
    // and assembler/eval/Resisters.

    // add tests for any text here if regression will be found

    test("single instruction with args", () => {
        const text = `
            MOV A, B
        `

        expect(assemble(text).text.slice(0, 1)).toEqual([
            0b01_111_000
        ])
    })

    test("multiple instructions", () => {
        const text = `
            MOV     C, D
            MOV     E, A
        `

        expect(assemble(text).text.slice(0, 2)).toEqual([
            0b01_001_010,
            0b01_011_111,
        ])
    })
})

describe("assembler", () => {
    test.each([
        `
            MOV A, B,
            LDA AAFH,
            HLT
        `
    ])("comma after arg it's not a error", (text: string) => {
        expect(() => assemble(text)).not.toThrow()
    })
})

describe("assembler labels", () => {
    test("single label", () => {
        const text = `
            NOP

        LABEL:              ; address 0x0001
            NOP
            JMP     LABEL
        `

        expect(assemble(text).text.slice(0, 5)).toEqual([
            0,          // NOP
            0,          // NOP after labels
            0b11000011, // JMP
            0x01,       // least significant byte
            0x00,       // most significant byte
        ])
    })

    test("multiple labels on single instruction", () => {
        const text = `
            NOP
            NOP

        LABEL1:

        LABEL2:

            NOP             ; address 0x0002
            JMP     LABEL2
            JMP     LABEL1
        `

        expect(assemble(text).text.slice(0, 9)).toEqual([
            0,          // NOP
            0,          // NOP
            0,          // NOP after labels
            0b11000011, // JMP
            0x02,       // least significant byte
            0x00,       // most significant byte
            0b11000011, // JMP
            0x02,       // least significant byte
            0x00,       // most significant byte
        ])
    })
})

describe("assembler errors", () => {
    test("undefined instructions", () => {
        const text = `
            MOVA    A, B
        `

        expect(() => assemble(text)).toThrowError(/MOVA/)
    })

    test("undefined value", () => {
        const text = `
            MOV     A, LOL
        `

        expect(() => assemble(text)).toThrowError(/LOL/)
    })

    test("not enough args", () => {
        const text = `
            MOV     A,   ; it's error, MOV inst required 2 arguments
        `

        expect(() => assemble(text)).toThrowError(/arguments/)
    })

    test.each([
        `
            MOV A, B, C     ; MOV required 2 arguments
        `,
        `
            IN A, B         ; IN - one argument
        `,
        `
            HLT A           ; HLT - no one argument
        `,
    ])("too many args", (text) => {
        expect(() => assemble(text)).toThrowError(/arguments/)
    })

    test("comma after instruction it's error", () => {
        const text = `
            RET ,
        `

        expect(() => assemble(text)).toThrowError(/unexpected/)
    })

    test("multiple comma it's a error", () => {
        const text = `
            MOV A,, B
        `

        expect(() => assemble(text)).toThrowError(/unexpected symbol/)
    })

    test("redefine EQU is't a error", () => {
        const text = `
            LOL:    EQU 10
                    NOP
            LOL:    EQU 20
        `

        expect(() => assemble(text)).toThrowError(/LOL:/)
    })

    test("redefine SET with EQU it's a error", () => {
        const text = `
            FOO:    SET 1
                    NOP
            FOO:    EQU 2
        `

        expect(() => assemble(text)).toThrowError(/redefined/)
    })

    test("db evaluating result must be one byte", () => {
        const text = `
            DATA:   DB  1FFH
        `

        expect(() => assemble(text)).toThrowError(/1FFH/)
    })

    test("dw evaluating result must be 2 bytes", () => {
        const text = `
            DATA:   DW  2FFAAH
        `

        expect(() => assemble(text)).toThrowError(/2FFAAH/)
    })

    test("ds evaluating result must be 2 bytes", () => {
        const text = `
            RESERVE:    DS  1FFFAH
        `

        expect(() => assemble(text)).toThrowError(/1FFFAH/)
    })

    test("big numbers", () => {
        const text = `
            MOV FFH, A
        `

        expect(() => assemble(text)).toThrowError(/max/)
    })

    test("lower case instruction it's a error", () => {
        const text = `
            ret
        `

        expect(() => assemble(text)).toThrowError(/ret/)
    })
})
