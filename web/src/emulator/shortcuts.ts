// shortcuts - helpers for getting value from microprocessor opcode
//
// Opcode formats
//
// Opcode contains and DESTINATION value and SOURCE value
// +-----------------+
// | x x D D D S S S |
// +-----------------+
//
// Opcode contains only DESTINATION value
// +-----------------+
// | x x D D D x x x |
// +-----------------+
//
// Opcode contains only SOURCE value
// +-----------------+
// | x x x x x S S S |
// +-----------------+
//
// Opcode contains RP value
// +-----------------+
// | x x R R x x x x |
// +-----------------+
//
// DESTINATION and SOURCE value always contains
// target register number (register insert)
//
// RP value contains 16-bit register (real or virtual)
// PC, SP, PSW - 16-bit registers
// B, D, HL - 16-bit registers

import {setclrb} from "@/libs/bitwise"
import {FlagsIndex, parityTable} from "@/emulator/tables"

const enum Mask {
    Src = 0b00000111,
    Dst = 0b00111000,
    Rp = 0b00110000,
}

// Extract SSS insert
// @param inst instruction opcode
const s = (inst: number): number => inst & Mask.Src

// Return DDD insert
// @param inst instruction opcode
const d = (inst: number): number => (inst & Mask.Dst) >> 3

// Return RP insert
// @param inst instruction opcode
const r = (inst: number): number => (inst & Mask.Rp) >> 4

// upZSPC - update flags by current flags state and accumulator value
function upZSPC(flags: number, a: number, isCarryAffected: boolean = true): number {

    flags = setclrb(flags, FlagsIndex.Zero, (a & 0xff) === 0)

    flags = setclrb(flags, FlagsIndex.Sign, a & 0x80)

    flags = setclrb(flags, FlagsIndex.Parity, parityTable[a])

    if (isCarryAffected) {
        flags = setclrb(flags, FlagsIndex.Carry, a & 0x100)
    }

    return flags
}

export {s, d, r, upZSPC}
