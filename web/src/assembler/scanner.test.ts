
import {scan, Rule, Rules} from "./scanner"

// All tests used standard set of Rules from @/assembler/structures
// todo: divide into 2 parts (only for scanner and only for Assembler Rules)
describe("scanner", () => {
    test.each([
        [" "],
        ["\t"],
        ["  "],
        ["\t "],
        [" \t"],
        ["\t\t"],
    ])("scan must join spaces (space and tabs) into one token", (text: string) => {
        expect([...scan(text, Rules)]).toHaveLength(1)
    })

    test.each([
        ["\n", 1],
        ["\n\n", 2],
        ["\n\n\n", 3],
    ])("scan must split newlines into multiple tokens", (text: any, len: any) => {
        expect([...scan(text, Rules)]).toHaveLength(len)
    })

    test("scan must calculate start/end index of lexemes", () => {
        const text = `aa bb cc`

        expect([...scan(text, Rules)]).toMatchObject([
            {start: 0, end: 2},  // "aa"
            {start: 2, end: 3},  // " "
            {start: 3, end: 5},  // "bb"
            {start: 5, end: 6},  // " "
            {start: 6, end: 8},  // "cc"
        ])
    })

    test("scan must calculate line number of lexemes", () => {
        const text = `
            NOP
            HLT
        `

        expect([...scan(text, Rules)]).toMatchObject([
            {line: 0},  // NewLine
            {line: 1},  // Space
            {line: 1},  // Id
            {line: 1},  // NewLine
            {line: 2},  // Space
            {line: 2},  // Id
            {line: 2},  // NewLine
            {line: 3},  // Space
        ])
    })

    test("scan must reset start/end numbers after new line token", () => {
        const text = "nop\nfoo\nbar"

        expect([...scan(text, Rules)]).toMatchObject([
            {start: 0, end: 3},  // "nop"
            {start: 3, end: 4},  // "\n"
            {start: 0, end: 3},  // "foo"
            {start: 3, end: 4},  // "\n"
            {start: 0, end: 3},  // "bar"
        ])
    })

    // static Rules
    test("scan must correct determine a comments", () => {
        const text = "HLT  ; Stop the processor"

        expect([...scan(text, Rules)]).toMatchObject([
            {},
            {},
            {rule: Rule.Comment, "lexeme": "; Stop the processor", "line": 0, "start": 5, "end": 25},
        ])
    })

    test.each([
        ["rule"],
        ["lexeme"],
        ["line"],
        ["start"],
        ["end"],
    ])("scan must return correct token structure", (p) => {
        const val = scan("nop", Rules).next().value

        expect(val).toHaveProperty(p)
    })

    test("scan must detect a labels", () => {
        const text = "@label1: ?label2:"

        expect([...scan(text, Rules)]).toMatchObject([
            {rule: Rule.Label, lexeme: "@label1:", line: 0, start: 0, end: 8},
            {},
            {rule: Rule.Label, lexeme: "?label2:", line: 0, start: 9, end: 17},
        ])
    })

    test("scan must detect undefined lexeme", () => {
        const text = "nop \""

        expect([...scan(text, Rules)]).toMatchObject([
            {rule: Rule.Id},
            {rule: Rule.Space},
            {rule: Rule.Undefined, lexeme: "\""},
        ])
    })

    test("undefined rule must ending at end of line", () => {
        const text = "nop \"undefined \nnop"

        expect([...scan(text, Rules)]).toMatchObject([
            {rule: Rule.Id},
            {rule: Rule.Space},
            {rule: Rule.Undefined, lexeme: "\"undefined "},
            {rule: Rule.NewLine},
            {rule: Rule.Id, lexeme: "nop"},
        ])
    })

    test("scan must detect open/close parenthesis", () => {
        const text = " ( )(  )"

        expect([...scan(text, Rules)]).toMatchObject([
            {rule: Rule.Space},
            {rule: Rule.OpenParenthesis},
            {rule: Rule.Space},
            {rule: Rule.CloseParenthesis},
            {rule: Rule.OpenParenthesis},
            {rule: Rule.Space},
            {rule: Rule.CloseParenthesis},
        ])
    })

    test("scan must detect $ symbol like identifier", () => {
        const text = "$"

        expect([...scan(text, Rules)]).toMatchObject([
            {rule: Rule.Id},
        ])
    })

    test("scan must detect not one $ symbol like different tokens", () => {
        expect([...scan("$$", Rules)]).toHaveLength(2)
    })
})

describe("complex scanner tests", () => {
    const text = `
        MVI     A, ABH

LOOP:
        DRC     A
        JNZ     LOOP    ; While a > 0
    `

    test("program with labels and comments", () => {
        expect([...scan(text, Rules)]).toMatchObject([

            // Line 0, just new line
            {rule: Rule.NewLine, lexeme: "\n",       line: 0, start: 0,  end: 1},

            // Line 1, "        MVI     A, ABH"
            {rule: Rule.Space,   lexeme: "        ", line: 1, start: 0,  end: 8},
            {rule: Rule.Id,      lexeme: "MVI",      line: 1, start: 8,  end: 11},
            {rule: Rule.Space,   lexeme: "     ",    line: 1, start: 11, end: 16},
            {rule: Rule.Id,      lexeme: "A",        line: 1, start: 16, end: 17},
            {rule: Rule.Comma,   lexeme: ",",        line: 1, start: 17, end: 18},
            {rule: Rule.Space,   lexeme: " ",        line: 1, start: 18, end: 19},
            {rule: Rule.Id,      lexeme: "ABH",      line: 1, start: 19, end: 22},
            {rule: Rule.NewLine, lexeme: "\n",       line: 1, start: 22, end: 23},

            // Line 2, Just new Line
            {rule: Rule.NewLine, lexeme: "\n",       line: 2, start: 0, end: 1},

            // Line 3, "LOOP:"
            {rule: Rule.Label,   lexeme: "LOOP:",    line: 3, start: 0, end: 5},
            {rule: Rule.NewLine, lexeme: "\n",       line: 3, start: 5, end: 6},

            // Line 4, "        DRC     A"
            {rule: Rule.Space,   lexeme: "        ", line: 4, start: 0,  end: 8},
            {rule: Rule.Id,      lexeme: "DRC",      line: 4, start: 8,  end: 11},
            {rule: Rule.Space,   lexeme: "     ",    line: 4, start: 11, end: 16},
            {rule: Rule.Id,      lexeme: "A",        line: 4, start: 16, end: 17},
            {rule: Rule.NewLine, lexeme: "\n",       line: 4, start: 17, end: 18},

            // Line 5, "        JNZ     LOOP    ; While a > 0"
            {rule: Rule.Space,   lexeme: "        ",      line: 5, start: 0,  end: 8},
            {rule: Rule.Id,      lexeme: "JNZ",           line: 5, start: 8,  end: 11},
            {rule: Rule.Space,   lexeme: "     ",         line: 5, start: 11, end: 16},
            {rule: Rule.Id,      lexeme: "LOOP",          line: 5, start: 16, end: 20},
            {rule: Rule.Space,   lexeme: "    ",          line: 5, start: 20, end: 24},
            {rule: Rule.Comment, lexeme: "; While a > 0", line: 5, start: 24, end: 37},
            {rule: Rule.NewLine, lexeme: "\n",            line: 5, start: 37, end: 38},

            // Line 6 (no new line), "    "
            {rule: Rule.Space, lexeme: "    ", line: 6, start: 0, end: 4},
        ])
    })
})
