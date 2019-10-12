import {DFA} from "@/libs/fsm"

// loadDFA - helper for creating DFA from string grammar.
let loadDFA = (cfg: string): DFA<string, string> => {
    const [states, alphabet, func, initial, finals] = cfg.trim().split("\n").map(i => i.trim())

    return new DFA(
        new Set(states.split(" ")),
        new Set(alphabet.split(" ")),
        new Set(func.split(",").map(i => i.split(" ")) as Array<[string, string, string]>),
        initial,
        new Set(finals.split(" ")),
    )
}

export {loadDFA};
