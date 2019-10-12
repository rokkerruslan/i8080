
import {ast}             from "./syntax"
import {Rules, scan} from "./scanner"

describe("ast must parse nodes without labels", () => {
    test("on simple instruction", () => {
        const text = `
            HLT
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {labels: []},
        ])
    })

    test("on multiple instructions", () => {
        const text = `
            MOV   A, B  ; Store B value to accumulator
            OUT   A     ; Use I/O
            HLT
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {labels: []},  // MOV
            {labels: []},  // OUT
            {labels: []},  // HLT
        ])
    })
})

describe("ast must parse nodes with labels", () => {
    test("with one label", () => {
        const text = `
            LABEL:   NOP
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {labels: [{lexeme: "LABEL:"}], mnemonic: {lexeme: "NOP"}},
        ])
    })

    test("with many labels", () => {
        const text = `
            LABEL1:
            LABEL2:
            LABEL3:
                NOP
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {
                labels: [
                    {lexeme: "LABEL1:"},
                    {lexeme: "LABEL2:"},
                    {lexeme: "LABEL3:"},
                ],
                mnemonic: {
                    lexeme: "NOP",
                }
            },
        ])
    })

    test("labels for different mnemonics", () => {
        const text = `
            LABEL1:
            LABEL2:
                NOP
            LABEL3:
            LABEL4:
                HLT
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {
                labels: [
                    {lexeme: "LABEL1:"},
                    {lexeme: "LABEL2:"},
                ],
                mnemonic: {lexeme: "NOP"},
            },
            {
                labels: [
                    {lexeme: "LABEL3:"},
                    {lexeme: "LABEL4:"},
                ],
                mnemonic: {lexeme: "HLT"},
            },
        ])
    })

    test("ast must correct parse one-line labels", () => {
        const text = `
            LABEL1: LABEL2: NOP
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {
                labels: [
                    {lexeme: "LABEL1:"},
                    {lexeme: "LABEL2:"},
                ],
                mnemonic: {lexeme: "NOP"},
            },
        ])
    })

    test("ast must correct parse one-line labels without space", () => {
        const text = `
            LABEL1:LABEL2:NOP
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {
                labels: [
                    {lexeme: "LABEL1:"},
                    {lexeme: "LABEL2:"},
                ],
                mnemonic: {lexeme: "NOP"},
            },
        ])
    })
})


describe("ast args", () => {
    test("without labels", () => {
        const text = `
            MOV
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {mnemonic: {lexeme: "MOV"}, ops: []},
        ])
    })

    test("two ops", () => {
        const text = `
            MOV A, B
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {
                mnemonic: {lexeme: "MOV"},
                ops: [
                    {lexeme: "A"},
                    {lexeme: "B"},
                ],
            },
        ])
    })

    test("multiple menemonics", () => {
        const text = `
            MOV A, B
            OUT A
            HLT
        `

        expect([...ast(scan(text, Rules))]).toMatchObject([
            {
                mnemonic: {lexeme: "MOV"},
                ops: [
                    {lexeme: "A"},
                    {lexeme: "B"},
                ]
            },
            {
                mnemonic: {lexeme: "OUT"},
                ops: [
                    {lexeme: "A"},
                ]
            },
            {
                mnemonic: {lexeme: "HLT"},
                ops: [],
            },
        ])
    })
})
