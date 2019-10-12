import {Token, Rule} from "./scanner"

type Func<T> = Set<[Array<T>, Array<Rule>, T, Function]>


class DFA<T> {
    func: Func<T>
    state: T
    finals: Set<T> = new Set()

    V: boolean

    constructor(func: Func<T>, initial: T, verbose = false) {
        this.func = func
        this.state = initial

        this.V = verbose
    }

    send(input: Token) {
        let current = this.state

        let isFound = false

        if (this.V) {
            console.log("==== SEND ==============================================")
        }

        for (const [states, symbols, next, func] of this.func) {
            if ((!states.length || states.includes(current)) && symbols.includes(input.rule)) {
                if (this.V) {
                    console.log("STATES:", states, "SYMBOLS:", symbols, "NEXT:", next, "INPUT:", input, "CURRENT", current)
                }

                func(input)
                this.state = next || this.state
                isFound = true
                break
            }
        }

        if (this.V) {
            console.log("==== END ==============================================")
        }

        if (!isFound) throw new Error(`unexpected symbol: ${JSON.stringify(input)}`)
    }

    check(sequence: Iterable<Token>) {
        for (const el of sequence) this.send(el)

        return this.finals.has(this.state)
    }
}

const KeepState = undefined

export {DFA, KeepState}
