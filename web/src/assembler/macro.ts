
import {Token} from "./scanner"
import {Inst} from "./syntax"

interface Macro {
    name: Token|null
    params: Array<string>
    nodes: Array<any>
}

// macro expand one statement to macro group.
let macro = function*(nodes: Iterable<Inst>, V: boolean = false) {
    let current: Macro = {name: null, nodes: [], params: []}

    enum State {Macro, Default}

    let state = State.Default

    let macros = new Map()

    for (let inst of nodes) {
        if (inst.mnemonic.lexeme === "macro") {

            if (V) console.log("MACRO START", inst)

            state = State.Macro

            if (inst.labels.length !== 1) {
                throw TypeError("macro MUST have only one name")
            }

            current = {name: inst.labels[0], params: [], nodes: []}

            continue
        }

        if (inst.mnemonic.lexeme === "endm") {
            if (V) console.log("MACRO END", inst)

            state = State.Default

            macros.set(current.name, current)

            continue
        }

        if (state == State.Macro) {
            if (V) console.log("MACRO INNER", inst)

            current.nodes.push(inst)
            continue
        }

        // Not macro
        if (!macros.has(inst.mnemonic)) {
            yield inst

        } else {
            if (V) console.log("USE MACRO", inst)

            for (const inst of current.nodes) yield inst
        }
    }
}

export {macro}
