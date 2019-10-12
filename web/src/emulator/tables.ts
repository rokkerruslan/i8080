// tables - collection pre-evaluated data array
// for fast flags computation.

// Pre-calculated parity flag for all
// available values of accumulator.
// For example:
// 0b00000000 - parity
// 0b00000001 - non parity
import {Dict} from "@/libs/collections"

export const parityTable = [
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
    1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
]

export enum FlagsIndex {
    Carry = 0,
    Parity = 2,
    AxCarry = 4,
    Zero = 6,
    Sign = 7,
}

export enum Flags {
    Carry = 1 << 0,
    Parity = 1 << 2,
    AxCarry = 1 << 4,
    Zero = 1 << 6,
    Sign = 1 << 7,
}

export let conditions = new Dict([
    [0, (f: number) => (f & Flags.Zero) === 0],
    [1, (f: number) => (f & Flags.Zero) !== 0],
    [2, (f: number) => (f & Flags.Carry) === 0],
    [3, (f: number) => (f & Flags.Carry) !== 0],
    [4, (f: number) => (f & Flags.Parity) === 0],
    [5, (f: number) => (f & Flags.Parity) !== 0],
    [6, (f: number) => (f & Flags.Sign) === 0],
    [7, (f: number) => (f & Flags.Sign) !== 0],
])

export const halfAarryTable = [0, 0, 1, 0, 1, 0, 1, 1]

export const subHalfCarryTable = [0, 1, 1, 1, 0, 0, 0, 1]
