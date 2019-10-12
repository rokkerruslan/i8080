
import {Dict}  from "@/libs/collections"
import {count} from "@/libs/extra"

export {Token, Rule, Rules, scan}

interface Token {
    rule: Rule
    lexeme: string
    line: number
    start: number
    end: number
}

enum Rule {
    String = "String",
    Comment = "Comment",
    NewLine = "Newline",
    Space = "Space",
    Comma = "Comma",
    Dot = "Dot",
    Mul = "Mul",
    Div = "Div",
    Add = "Add",
    Sub = "Sub",
    OpenParenthesis = "OpenParenthesis",
    CloseParenthesis = "CloseParenthesis",
    Label = "Label",
    Id = "Id",
    Undefined = "Undefined",
}

// todo: add explain if order sequence is ...
const Rules = new Dict([
    [Rule.String, /^'.*'/],
    [Rule.Comment, /^;.*/],
    [Rule.NewLine, /^\n/],
    [Rule.Space, /^[ \t]+/],
    [Rule.Comma, /^,/],
    [Rule.Mul, /^\*/],
    [Rule.Div, /^\//],
    [Rule.Add, /^\+/],
    [Rule.Sub, /^-/],
    [Rule.OpenParenthesis, /^\(/],
    [Rule.CloseParenthesis, /^\)/],
    [Rule.Label, /^[?@]?\w+:/],
    [Rule.Id, /^[\w]+|\${1}/],
    [Rule.Undefined, /^.*/],
])

// analyse text by target rules
//
// Generate sequence of tokens
//
// Example:
//    const text = `let variable=42`
//
//    const rules = new Dict([
//       ["id",    /[a-z]+/],
//       ["space", /\s+/],
//       ["eq",    /=/],
//       ["num",   /[0-9]+/],
//    ])
//
//    for (const token of scan(text, terminals)) console.log(token)
//
// Output:
//    {rule: "id",    lexeme: "let",      start: 0,  end: 3,  line: 0}
//    {rule: "space", lexeme: " ",        start: 3,  end: 4,  line: 0}
//    {rule: "id",    lexeme: "variable", start: 4,  end: 12, line: 0}
//    {rule: "eq",    lexeme: "=",        start: 12, end: 13, line: 0}
//    {rule: "num",   lexeme: "42",       start: 13, end: 15, line: 0}
let scan = function*(text: string, terminals: Dict<Rule, RegExp>): IterableIterator<Token> {

    // Scanner position at line
    let start = 0

    let line = 0

    while (text) {
        for (const [terminal, re] of terminals.entries()) {
            const match = text.match(re)

            if (match === null) continue  // That terminal not does not fit

            const [lexeme] = match

            yield {rule: terminal, lexeme, line, start, end: start + lexeme.length}

            start += lexeme.length

            let lines = count("\n", lexeme)
            line += lines

            if (lines != 0) {
                start = 0
            }

            text = text.slice(lexeme.length)

            break
        }
    }
}
