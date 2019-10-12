import {State} from "@/emulator/index"
import {Format, ifmt} from "@/libs/strings";

export {CPUState}

interface CPUState {
    state: State

    cycles: number

    pc: number
    sp: number
    flags: number

    a: number
    b: number
    c: number
    d: number
    e: number
    h: number
    l: number
}

const init = (): CPUState => {
    return {
        state: State.Reseted,
        cycles: 0,
        pc: 0,
        sp: 0,
        flags: 2,
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        e: 0,
        h: 0,
        l: 0,
    }
}

const cycle = (s: CPUState, inst: number): CPUState => {

    switch (inst) {
        default:
            throw new Error("Undefined inst: " + ifmt(inst, Format.Hex, 2))

        // ==== DATA TRANSFER GROUP ======================== //

        case 0x40:              // mov b, b
        case 0x41:              // mov b, c
        case 0x42:              // mov b, d
        case 0x43:              // mov b, e
        case 0x44:              // mov b, h
        case 0x45:              // mov b, l
        case 0x47:              // mov b, a
            return movr(s, 1, 2)
    }

    return s
}

const clone = (...objs: Array<Object>) => Object.assign({}, ...objs)

const movr = (s: CPUState, to: number, from: number): CPUState => clone(s, s.pc + 1, s.cycles + 1)
