import {intersection} from "@/libs/shortcuts";

type TFunc<T, S> = Set<[T, S, T]>

// Push-down automation
class PDA {
    // todo: implementation
}

class Epsilon {
}

// const EpsilonNFAGrammar = `
//    Q0 Q1 Q2 Q3 Q4 Q5
//    . + - 0 1 2 3 4 5 6 7 8 9
//    Q0 + Q1,Q0 - Q1,Q1 . Q2,Q1 0 Q1,Q1 1 Q1,Q1 2 Q1,Q1 3 Q1,Q1 4 Q1,Q1 5 Q1,Q1 6 Q1,Q1 7 Q1,Q1 8 Q1,Q1 9 Q1,Q1 0 Q4,Q1 1 Q4,Q1 2 Q4,Q1 3 Q4,Q1 4 Q4,Q1 5 Q4,Q1 6 Q4,Q1 7 Q4,Q1 8 Q4,Q1 9 Q4,Q2 0 Q3,Q2 1 Q3,Q2 2 Q3,Q2 3 Q3,Q2 4 Q3,Q2 5 Q3,Q2 6 Q3,Q2 7 Q3,Q2 8 Q3,Q2 9 Q3,Q3 0 Q3,Q3 1 Q3,Q3 2 Q3,Q3 3 Q3,Q3 4 Q3,Q3 5 Q3,Q3 6 Q3,Q3 7 Q3,Q3 8 Q3,Q3 9 Q3,Q4 . Q3
//    Q0 Q1,Q3 Q5
//    Q0
//    Q5
// `;
//
// let enfa = connect(EpsilonNFAGrammar);
//
// const chain = "-141.11";
//
// let enfar = enfa.resolve(Array.from(chain));
//
// console.log("EPSILON NFA CHAIN:", chain, "RESOLVE:", enfar);
class EpsilonNFA<T, S> {
    constructor(private states: Set<T>,
                private symbols: Set<S>,
                private tfunc: TFunc<T, S>,
                private cstates: Set<T>,
                private finals: Set<T>,
                private V: boolean = true) {
    }

    static load(cfg: string): EpsilonNFA<string, string> {
        const [states, alphabet, func, efunc, initial, finals] = cfg.trim().split("\n").map(i => i.trim());

        const f: Array<Array<string | Epsilon>> = func.split(",").map(i => i.split(" "));

        const f2: Array<Array<string | Epsilon>> = efunc.split(",").map(i => i.split(" "));

        f2.map(a => a.splice(1, 0, new Epsilon()));

        const res = f.concat(f2) as Array<[string, string, string]>;

        return new EpsilonNFA(
            new Set(states.split(" ")),
            new Set(alphabet.split(" ")),
            new Set(res),
            new Set([initial]),
            new Set(finals.split(" ")),
        )
    }

    apply(i: S) {
        let states = new Set<T>();

        for (const [state, sym, next] of this.tfunc) {

            if (this.cstates.has(state) && (sym instanceof Epsilon)) {
                states.add(next);

                if (this.V) console.log("EPSILON SYMBOL; NEXT STATE:", next);

                continue;
            }

            if (!this.cstates.has(state) || i !== sym) continue;

            if (this.V) console.log("APPLY OLD STATE:", state, "SYMBOL:", i, "NEW STATE:", next);

            states.add(next);
        }

        if (this.V) console.log("APPLY:", i, "NFA STATES:", states);

        this.cstates = states;
    }

    resolve(seq: Array<S>): boolean {
        seq.map((i: S) => this.apply(i));

        return intersection(this.finals, this.cstates).size !== 0;
    }
}

// NFA - non-deterministic finite automation.
//
// const nfaGrammar = `
//    q0 q1 q2
//    0 1
//    q0 0 q0,q0 0 q1,q0 1 q0,q1 1 q2
//    q0
//    q2
// `;
//
// let nfa = connect(nfaGrammar);
//
// let r = nfa.resolve(Array.from("1001"));
//
// console.log("NFA RESOLVE:", r);
class NFA<T, S> {
    constructor(private states: Set<T>,
                private symbols: Set<S>,
                private tfunc: TFunc<T, S>,
                private cstates: Set<T>,
                private finals: Set<T>,
                private V: boolean = true) {
    }

    static load(cfg: string): NFA<string, string> {
        const [states, alphabet, func, initial, finals] = cfg.trim().split("\n").map(i => i.trim());

        return new NFA(
            new Set(states.split(" ")),
            new Set(alphabet.split(" ")),
            new Set(func.split(",").map(i => i.split(" ")) as Array<[string, string, string]>),
            new Set([initial]),
            new Set(finals.split(" ")),
        )
    }

    apply(i: S) {
        let states = new Set<T>();

        for (const [state, sym, next] of this.tfunc) {
            if (!this.cstates.has(state) || i !== sym) continue;

            if (this.V) console.log("APPLY OLD STATE:", state, "SYMBOL:", i, "NEW STATE:", next);

            states.add(next);
        }

        if (this.V) console.log("APPLY:", i, "NFA STATES:", states);

        this.cstates = states;
    }

    resolve(seq: Array<S>): boolean {
        seq.map((i: S) => this.apply(i));

        return intersection(this.finals, this.cstates).size !== 0;
    }
}

// DFA - deterministic finite automaton
//
// DFA - M is a 5-tuple,
//    (Q, S, D, q0, F), consisting of:
//    a set of available states Q
//    a finite set of input symbols called the alphabet S
//    a transition function D: Q x S -> Q
//    an initial or start state q0 { Q
//    a set of accept states F { Q
//
// Example
//    const grammar = `
//       Q0 Q1 Q2
//       0 1
//       Q0 0 Q1,Q0 1 Q0,Q1 0 Q2,Q1 1 Q0,Q2 0 Q2,Q2 1 Q0
//       Q0
//       Q2
//    `;
//
//    let dfa = loadDFA(grammar);
//
//    let r = dfa.resolve(Array.from("10000001100000101001111111100"));
//
//    console.log("DFA RESOLVE:", r);
class DFA<T, S> {
    state: T;

    constructor(public states: Set<T>,
                public symbols: Set<S>,
                public tfunc: TFunc<T, S>,
                public initial: T,
                public finals: Set<T>,
                public V: boolean = false) {
        this.state = initial;
    }

    apply(i: S) {
        for (const [state, sym, next] of this.tfunc) {
            if (!(this.state === state && i === sym)) continue;

            if (this.V) console.log("APPLY OLD STATE:", state, "SYMBOL:", i, "NEW STATE:", next);

            this.state = next;

            return;
        }

        throw TypeError(`unexpected token: ${i}`);
    }

    resolve(seq: Array<S>): boolean {
        seq.map((i: S) => this.apply(i));

        return this.finals.has(this.state);
    }
}

const AnyState: ReadonlyArray<any> = [];
const KeepState = undefined;

export {DFA, AnyState, KeepState, NFA, EpsilonNFA};
