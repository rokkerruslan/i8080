
import {DFA, KeepState}  from "./fsm"
import {Token, Rule} from "./scanner"

export {ast, Inst}

// noinspection JSUnusedLocalSymbols
const grammar = `
    source -> insts
    insts  -> inst | inst NewLine insts | EMPTY
    inst   -> labels Id ops

    labels -> Label | Label NewLine labels | EMPTY

    ops -> op | op Colon | op Colon ops | EMPTY
    op  -> Id
`

interface Inst {
    labels: Array<Token>
    mnemonic: Token
    ops: Array<Token>
}

let ast = (tokens: Iterable<Token>, verbose: boolean = false): Iterable<Inst> => {
    let insts: Array<any> = []

    let labels: Array<Token> = []
    let mnemonic: Token
    let ops: Array<Token> = []

    enum State {
        Label = "label", Ops = "ops", Comma = "comma", NewLine = "newline",
    }

    const noop = () => {}
    const pushLabel = (t: Token) => labels.push(t)
    const pushMnemonic = (t: Token) => mnemonic = t
    const pushOp = (t: Token) => ops.push(t)
    const pushInst = () => {
        insts.push({ labels: labels, mnemonic: mnemonic, ops: ops })
        labels = []
        ops = []
    }

    const dfa = new DFA(
        // Transition function
        new Set([
            // Always skip "Comment" and "Space" tokens
            [[],                           [Rule.Comment, Rule.Space], KeepState,     noop],

            // New lines
            [[State.NewLine, State.Label], [Rule.NewLine],                 KeepState,     noop],

            // Labels
            [[State.NewLine, State.Label], [Rule.Label],                   State.Label,   pushLabel],

            // Mnemonic
            [[State.NewLine, State.Label], [Rule.Id],                      State.Ops,     pushMnemonic],

            // Operands parsing
            [[State.Ops],                  [Rule.Id, Rule.String],     State.Comma,   pushOp],

            // Finish of an operand
            [[State.Comma],                [Rule.Comma],                   State.Ops,     noop],

            // Finish of a Instruction
            [[State.Ops, State.Comma],     [Rule.NewLine],                 State.NewLine, pushInst],
        ]),

        // Initial State
        State.NewLine,

        verbose,
    )

    dfa.check(tokens)

    return insts
}
