// Core Emulator Functionality
//
// opcodes: http://www.emulator101.com/reference/8080-by-opcode.html

import {Executable} from "@/assembler"
import {Format, ifmt} from "@/libs/strings"
import {clrb, from16, high, low, setb, setclrb, to16, to8, xorb} from "@/libs/bitwise"

import {d, r, s, upZSPC} from "./shortcuts"
import {conditions, Flags, FlagsIndex, halfAarryTable, subHalfCarryTable} from "./tables"
import {Register, RegisterPair} from './register_types'

class CpuError extends Error {}

const OverBit = 0b100000000

export enum State {
    Reseted,
    Stopped,
    Halted,
    Running,
}

export class Emulator {

    // State used for control emulator
    state = State.Reseted

    // The program counter is a 16 bit register which
    // is accessible to the programmer and whose contents
    // indicate the address of the next instruction
    // to be executed.
    pc = 0

    // A stack is an area of memory set aside by the
    // programmer in which data or addresses are stored
    // and retrieved by stack operations.
    sp = 0

    // Second bit in flag register is always true.
    flags = 2

    // Registers
    a = 0
    b = 0
    c = 0
    d = 0
    e = 0
    h = 0
    l = 0

    isInterruptEnabled: boolean = true

    // Unsized queue of received interrupts.
    unprocessedInterrupts: Array<number> = []

    cycles: number = 0

    interval: number = 0

    // ==== CONNECTED BLOCKS =============================== //

    // Up to 65.536 bytes
    memory: Array<number> = new Array(2 ** 16).fill(0)

    // Debug information
    lines: Array<number> = []

    // Up to 256 input/output devices
    io: Array<number> = []

    // Lines of instructions where emulator will be stop
    breakpoints: Set<number> = new Set()

    V = true

    // ==== Control Emulator =============================== //

    get flagS() { return this.getFlag(Flags.Sign) }
    // noinspection JSUnusedGlobalSymbols
    set flagS(v: boolean) { this.setFlag(Flags.Sign, v) }

    get flagZ() { return this.getFlag(Flags.Zero) }
    // noinspection JSUnusedGlobalSymbols
    set flagZ(v: boolean) { this.setFlag(Flags.Zero, v) }

    get flagAC() { return this.getFlag(Flags.AxCarry) }
    // noinspection JSUnusedGlobalSymbols
    set flagAC(v: boolean) { this.setFlag(Flags.AxCarry, v) }

    get flagP() { return this.getFlag(Flags.Parity) }
    // noinspection JSUnusedGlobalSymbols
    set flagP(v: boolean) { this.setFlag(Flags.Parity, v ) }

    get flagCY() { return this.getFlag(Flags.Carry) }
    // noinspection JSUnusedGlobalSymbols
    set flagCY(v: boolean) { this.setFlag(Flags.Carry, v ) }

    setFlag(f: number, v: boolean) {
        if (v) {
            this.flags |= f
        } else {
            this.flags = this.flags & (~f)
        }
    }

    getFlag(f: number): boolean {
        return Boolean(this.flags & f)
    }

    gettable = [() => this.b, () => this.c, () => this.d, () => this.e, () => this.h, () => this.l, () => 0, () => this.a]
    settable = [
        (v: number) => this.b = v,
        (v: number) => this.c = v,
        (v: number) => this.d = v,
        (v: number) => this.e = v,
        (v: number) => this.h = v,
        (v: number) => this.l = v,
        () => 0,  // m
        (v: number) => this.a = v,
    ]

    get hl() {
        return to16(this.h, this.l)
    }

    get memhl() {
        return this.memory[this.hl]
    }

    set memhl(value: number) {
        this.memory.splice(this.hl, 1, to8(value))
    }

    toggleBreakpoint(line: number) {
        this.breakpoints.has(line) ? this.breakpoints.delete(line) : this.breakpoints.add(line)
    }

    load(objectFile: Executable) {
        this.memory = objectFile.text
        this.lines = objectFile.debug
    }

    // int - send interrupt to microprocessor.
    int(n: number) {
        if (this.V) console.log("RECEIVED INTERRUPT:", n)

        if (this.state === State.Halted) {
            this.pc = 8 * n
            this.state = State.Stopped
        } else {
            this.unprocessedInterrupts.push(n)
        }
    }

    // go - run emulation.
    go(frequency: number) {
        if (this.V) console.log("========= RUN ===========\nEMULATOR SPEED:", frequency)

        this.continue(frequency)
    }

    // Already fetched instruction will be execute.
    stop() {
        if (this.V) console.log("STOP", "PC:", this.pc)

        this.state = State.Stopped

        clearInterval(this.interval)
    }

    // continue - run emulation without state reset.
    continue(frequency: number) {
        if (this.V) console.log("CONTINUE", "FREQUENCE:", frequency)

        this.state = State.Running

        this.interval = setInterval(() => {
            this.cycle()
        }, 1000 / frequency)
    }

    // reset - clear all registers.
    reset() {
        if (this.V) console.log("RESET")

        this.state = State.Reseted
        this.pc = 0
        this.sp = 0
        this.flags = 2
        this.cycles = 0
        this.a = 0
        this.b = 0
        this.c = 0
        this.d = 0
        this.e = 0
        this.h = 0
        this.l = 0
    }

    // ==== OTHER HELPERS ================================== //

    // run full cycle (fetch, decode, execute) for one instruction.
    execute() {
        this.cycle()
    }

    // setr - set new value for register
    setr(n: Register, v: number) {
        this.settable[n](v & 0xff)
    }

    // getr - get register value
    getr(n: Register): number {
        return this.gettable[n]()
    }

    setrp(rp: RegisterPair, h: number, l: number) {
        switch (rp) {
            case RegisterPair.B:
                this.b = h
                this.c = l
                break

            case RegisterPair.D:
                this.d = h
                this.e = l
                break

            case RegisterPair.H:
                this.h = h
                this.l = l
                break

            case RegisterPair.PSW:
                this.sp = to16(h, l)
                break
        }
    }

    getrp(rp: RegisterPair) {
        switch (rp) {
            case RegisterPair.B:
                return to16(this.b, this.c)

            case RegisterPair.D:
                return to16(this.d, this.e)

            case RegisterPair.H:
                return to16(this.h, this.l)

            case RegisterPair.PSW:
                return this.sp

            default:
                throw new Error(`Undefined rp: ${rp}`)
        }
    }

    processInterrupt() {
        if (this.unprocessedInterrupts.length === 0) return

        if (this.V) console.log("PROCESS INTERRUPTS:", this.unprocessedInterrupts)

        if (this.unprocessedInterrupts.length > 1) {
            throw Error("unprocessedInterrupts too big")
        }

        this.memory.splice(this.sp - 2, 2, low(this.pc), high(this.pc))
        this.sp -= 2

        console.log("PREV PC", this.pc)
        this.pc = 8 * this.unprocessedInterrupts[0]

        console.log("NEW PC", this.pc)

        this.unprocessedInterrupts = []
    }

    // Cycle - execute one machine instruction
    //
    // One machine cycle contains some steps. First, check
    // unprocessed interrupt and process it. Then read one
    // byte from memory (instruction opcode). Decode opcode
    // and execute method that implements behaviour of
    // instruction. Last part it's breakpoint handling.
    //
    cycle() {
        this.processInterrupt()

        let inst = this.memory[this.pc]

        const addressToAdd = 0x02B3; // Memory address 2130H
        const valueToAdd = 0x3F; // Value 53H

            // Check if the memory address exists
        if (addressToAdd < this.memory.length) {
            this.memory[addressToAdd] = valueToAdd; // Add the value to the memory address
        } else {
            console.error("Memory address does not exist.");
        }
        
        if (this.V) console.log("EXECUTE:", ifmt(inst), "PC:", ifmt(this.pc, Format.Hex, 4))

        // ==== DECODER ==================================== //

        switch (inst) {
            default:
                throw new Error("Undefined inst: " + ifmt(inst, Format.Hex, 2))

            // ==== DATA TRANSFER GROUP ==================== //

            case 0x40:              // mov b, b
            case 0x41:              // mov b, c
            case 0x42:              // mov b, d
            case 0x43:              // mov b, e
            case 0x44:              // mov b, h
            case 0x45:              // mov b, l
            case 0x47:              // mov b, a

            case 0x48:              // mov c, b
            case 0x49:              // mov c, c
            case 0x4a:              // mov c, d
            case 0x4b:              // mov c, e
            case 0x4c:              // mov c, h
            case 0x4d:              // mov c, l
            case 0x4f:              // mov c, a

            case 0x50:              // mov d, b
            case 0x51:              // mov d, c
            case 0x52:              // mov d, d
            case 0x53:              // mov d, e
            case 0x54:              // mov d, h
            case 0x55:              // mov d, l
            case 0x57:              // mov d, a

            case 0x58:              // mov e, b
            case 0x59:              // mov e, c
            case 0x5a:              // mov e, d
            case 0x5b:              // mov e, e
            case 0x5c:              // mov e, h
            case 0x5d:              // mov e, l
            case 0x5f:              // mov e, a

            case 0x60:              // mov h, b
            case 0x61:              // mov h, c
            case 0x62:              // mov h, d
            case 0x63:              // mov h, e
            case 0x64:              // mov h, h
            case 0x65:              // mov h, l
            case 0x67:              // mov h, a

            case 0x68:              // mov l, b
            case 0x69:              // mov l, c
            case 0x6a:              // mov l, d
            case 0x6b:              // mov l, e
            case 0x6c:              // mov l, h
            case 0x6d:              // mov l, l
            case 0x6f:              // mov l, a

            case 0x78:              // mov a, b
            case 0x79:              // mov a, c
            case 0x7a:              // mov a, d
            case 0x7b:              // mov a, e
            case 0x7c:              // mov a, h
            case 0x7d:              // mov a, l
            case 0x7f:              // mov a, a
                this.movr(d(inst), s(inst))
                break

            // ==== BLOCK "MOV M, RRR" BELOW =============== //

            case 0x46:              // mov b, m
            case 0x4e:              // mov c, m
            case 0x56:              // mov d, m
            case 0x5e:              // mov e, m
            case 0x66:              // mov h, m
            case 0x6e:              // mov l, m
            case 0x7e:              // mov a, m
                this.movfm(d(inst))
                break

            case 0x70:              // mov m, b
            case 0x71:              // mov m, c
            case 0x72:              // mov m, d
            case 0x73:              // mov m, e
            case 0x74:              // mov m, h
            case 0x75:              // mov m, l
            case 0x77:              // mov m, a
                this.movtm(s(inst))
                break

            case 0x06:              // mvi b, data8
            case 0x0e:              // mvi c, data8
            case 0x16:              // mvi d, data8
            case 0x1e:              // mvi e, data8
            case 0x26:              // mvi h, data8
            case 0x2e:              // mvi l, data8
            case 0x3e:              // mvi a, data8
                this.mvi(d(inst))
                break

            case 0x36:              // mvi m, data8
                this.mvim()
                break

            case 0x01:              // lxi b, data16
            case 0x11:              // lxi d, data16
            case 0x21:              // lxi h, data16
            case 0x31:              // lxi sp, data16
                this.lxi(r(inst))
                break

            case 0x3a:
                this.lda()
                break

            case 0x32:
                this.sta()
                break

            case 0x2a:
                this.lhld()
                break

            case 0x22:
                this.shld()
                break

            case 0x0a:              // ldax b
            case 0x1a:              // ldax d
                this.ldax(r(inst))
                break

            case 0x02:              // stax b
            case 0x12:              // stax d
                this.stax(r(inst))
                break

            case 0xeb:
                this.xchg()
                break

            // ==== ARITHMETIC GROUP ======================= //

            case 0x80:              // add b
            case 0x81:              // add c
            case 0x82:              // add d
            case 0x83:              // add e
            case 0x84:              // add h
            case 0x85:              // add l
            case 0x87:              // add a
                this.add(s(inst))
                break

            case 0x86:
                this.addm()
                break

            case 0xc6:
                this.adi()
                break

            case 0x88:              // adc b
            case 0x89:              // adc c
            case 0x8a:              // adc d
            case 0x8b:              // adc e
            case 0x8c:              // adc h
            case 0x8d:              // adc l
            case 0x8f:              // adc a
                this.adc(s(inst))
                break

            case 0x8e:
                this.adcm()
                break

            case 0xce:
                this.aci()
                break

            case 0x90:              // sub b
            case 0x91:              // sub c
            case 0x92:              // sub d
            case 0x93:              // sub e
            case 0x94:              // sub h
            case 0x95:              // sub l
            case 0x97:              // sub a
                this.sub(s(inst))
                break

            case 0x96:
                this.subm()
                break

            case 0xd6:
                this.sui()
                break

            case 0x98:              // sbb b
            case 0x99:              // sbb c
            case 0x9a:              // sbb d
            case 0x9b:              // sbb e
            case 0x9c:              // sbb h
            case 0x9d:              // sbb l
            case 0x9f:              // sbb a
                this.sbb(s(inst))
                break

            case 0x9e:
                this.sbbm()
                break

            case 0xde:
                this.sbi()
                break

            case 0x04:              // inr b
            case 0x0c:              // inr c
            case 0x14:              // inr d
            case 0x1c:              // inr e
            case 0x24:              // inr h
            case 0x2c:              // inr l
            case 0x3c:              // inr a
                this.inr(d(inst))
                break

            case 0x34:
                this.inrm()
                break

            case 0x05:              // dcr b
            case 0x0d:              // dcr c
            case 0x15:              // dcr d
            case 0x1d:              // dcr e
            case 0x25:              // dcr h
            case 0x2d:              // dcr l
            case 0x3d:              // dcr a
                this.dcr(d(inst))
                break

            case 0x35:
                this.dcrm()
                break

            case 0x03:              // inx b
            case 0x13:              // inx d
            case 0x23:              // inx h
            case 0x33:              // inx sp
                this.inx(r(inst))
                break

            case 0x0b:              // dcx b
            case 0x1b:              // dcx d
            case 0x2b:              // dcx h
            case 0x3b:              // dcx sp
                this.dcx(r(inst))
                break

            case 0x09:              // dad b
            case 0x19:              // dad d
            case 0x29:              // dad h
            case 0x39:              // dad sp
                this.dad(r(inst))
                break

            case 0x27:
                this.daa()
                break

            // ==== LOGIC GROUP ============================ //

            case 0xa0:              // ana b
            case 0xa1:              // ana c
            case 0xa2:              // ana d
            case 0xa3:              // ana e
            case 0xa4:              // ana h
            case 0xa5:              // ana l
            case 0xa7:              // ana a
                this.ana(r(inst))
                break

            case 0xa6:
                this.anam()
                break

            case 0xe6:
                this.ani()
                break

            case 0xa8:              // xra b
            case 0xa9:              // xra c
            case 0xaa:              // xra d
            case 0xab:              // xra e
            case 0xac:              // xra h
            case 0xad:              // xra l
            case 0xaf:              // xra a
                this.xra(s(inst))
                break

            case 0xae:
                this.xram()
                break

            case 0xee:
                this.xri()
                break

            case 0xb0:              // ora b
            case 0xb1:              // ora c
            case 0xb2:              // ora d
            case 0xb3:              // ora e
            case 0xb4:              // ora h
            case 0xb5:              // ora l
            case 0xb7:              // ora a
                this.ora(s(inst))
                break

            case 0xb6:
                this.oram()
                break

            case 0xf6:
                this.ori()
                break

            case 0xb8:              // cmp b
            case 0xb9:              // cmp c
            case 0xba:              // cmp d
            case 0xbb:              // cmp e
            case 0xbc:              // cmp h
            case 0xbd:              // cmp l
            case 0xbf:              // cmp a
                this.cmp(s(inst))
                break

            case 0xbe:
                this.cmpm()
                break

            case 0xfe:
                this.cpi()
                break

            case 0x07:
                this.rlc()
                break

            case 0x0f:
                this.rrc()
                break

            case 0x17:
                this.ral()
                break

            case 0x1f:
                this.rar()
                break

            case 0x2f:
                this.cma()
                break

            case 0x3f:
                this.cmc()
                break

            case 0x37:
                this.stc()
                break

            // ==== BRANCH GROUP =========================== //

            case 0xc3:
                this.jmp()
                break

            case 0xc2:                 // jnz
            case 0xca:                 // jz
            case 0xd2:                 // jnc
            case 0xda:                 // jc
            case 0xe2:                 // jpo
            case 0xea:                 // jpe
            case 0xf2:                 // jp
            case 0xfa:                 // jm
                this.jcond(d(inst))
                break

            case 0xcd:
                this.call()
                break

            case 0xc4:                 // cnz
            case 0xcc:                 // cz
            case 0xd4:                 // cnc
            case 0xdc:                 // cc
            case 0xe4:                 // cpo
            case 0xec:                 // cpe
            case 0xf4:                 // cp
            case 0xfc:                 // cm
                this.ccond(d(inst))
                break

            case 0xc9:
                this.ret()
                break

            case 0xc0:                 // rnz
            case 0xc8:                 // rz
            case 0xd0:                 // rnc
            case 0xd8:                 // rc
            case 0xe0:                 // rpo
            case 0xe8:                 // rpe
            case 0xf0:                 // rp
            case 0xf8:                 // rm
                this.rcond(d(inst))
                break

            case 0xc7:                 // rst 0
            case 0xcf:                 // rst 1
            case 0xd7:                 // rst 2
            case 0xdf:                 // rst 3
            case 0xe7:                 // rst 4
            case 0xef:                 // rst 5
            case 0xf7:                 // rst 6
            case 0xff:                 // rst 7
                this.rst(d(inst))
                break

            case 0xe9:
                this.pchl()
                break

            // ==== STACK, I/O AND MACHINE CONTROL GROUP === //

            case 0xc5:                 // push b
            case 0xd5:                 // push d
            case 0xe5:                 // push h
                this.push(r(inst))
                break

            case 0xf5:
                this.pushpsw()
                break

            case 0xc1:                 // pop b
            case 0xd1:                 // pop d
            case 0xe1:                 // pop h
                this.pop(r(inst))
                break

            case 0xf1:
                this.poppsw()
                break

            case 0xe3:
                this.xthl()
                break

            case 0xdb:
                this.in()
                break

            case 0xd3:
                this.out()
                break

            case 0xfb:
                this.ei()
                break

            case 0xf3:
                this.di()
                break

            case 0x76:
                this.hlt()
                break

            case 0x00:
                this.nop()
                break
        }

        // Stop if breakpoint
        if (this.breakpoints.has(this.lines[this.pc])) {
            clearInterval(this.interval)
            this.state = State.Stopped
        }
    }

    // ==== INSTRUCTIONS =================================== //

    // DATA TRANSFER GROUP
    //
    // This group of instructions transfers data to and from
    // register and memory. Condition flags are not affected by
    // any instruction is this group.

    // Move Register
    //
    // (to) <- (from)
    //
    // The content of register `from` is moved to register `to`.
    movr(to: number, from: number) {
        this.setr(to, this.getr(from))
        this.pc += 1
        this.cycles += 1
    }

    // Move from memory
    //
    // (to) <- ((H) (L))
    //
    // The content of the memory location, whose address is in registers H and L,
    // is moved to register `to`.
    movfm(to: number) {
        this.setr(to, this.memhl)
        this.pc += 1
        this.cycles += 2
    }

    // Move to memory
    //
    // ((H) (L)) <- (from)
    //
    // The content of the register `from`, is moved to the memory location
    // whose address is in registers `H` and `L`.
    movtm(from: number) {
        this.memhl = this.getr(from)
        this.pc += 1
        this.cycles += 2
    }

    // Move immediate
    //
    // (to) <- (byte 2)
    //
    // The content of `byte 2` of the instruction is moved to register `to`.
    mvi(to: number) {
        this.setr(to, this.memory[this.pc + 1])
        this.pc += 2
        this.cycles += 2
    }

    // Move to memory immediate
    //
    // ((H) (L)) <- (byte 2)
    //
    // The content of `byte 2` of the instruction is moved to the memory location
    // whose address is in registers `H` and `L`.
    mvim() {
        this.memhl = this.memory[this.pc + 1]
        this.pc += 2
        this.cycles += 3
    }

    // Load register pair immediate
    //
    // (rh) <- (byte3) (rl) <- (byte 2)
    //
    // `Byte 3` of the instruction is moved into the high-order register
    //    of the register pair.
    // `Byte 2` of the inscruction is moved into the low-order register
    //    of the register pair.
    lxi(rp: RegisterPair) {
        this.setrp(rp, this.memory[this.pc + 2], this.memory[this.pc + 1])
        this.pc += 3
        this.cycles += 3
    }

    // Load accumulator direct
    //
    // (A) <- ((byte3)(byte2))
    //
    // The content of the memory location, whose address
    // is specified in `byte 2` and `byte 3` of the instruction, is
    // mode to register `A`.
    lda() {
        this.a = this.memory[to16(this.memory[this.pc + 2], this.memory[this.pc + 1])]
        this.pc += 3
        this.cycles += 4
    }

    // Store Accumulator direct
    //
    // ((byte3)(byte2)) <- (A)
    //
    // The content of the accumulator is moved to the memory location
    // whose address is specified in `byte 2` and `byte 3`
    // of the instruction.
    sta() {
        this.memory.splice(to16(this.memory[this.pc + 2], this.memory[this.pc + 1]), 1, this.a)
        this.pc += 3
        this.cycles += 4
    }

    // Load H and L direct
    //
    // (L) <- ((byte3)(byte2))
    // (H) <- ((byte3)(byte2) + 1)
    //
    // The content of the memory location, whose address
    // is specified in `byte 2` and `byte 3` of the instruction, is
    // moved to register `L`. The content of the memory location at
    // the succeeding address is moved to register `H`.
    lhld() {
        const addr = to16(this.memory[this.pc + 2], this.memory[this.pc + 1])
        this.setrp(RegisterPair.H, this.memory[addr + 1], this.memory[addr])
        this.pc += 3
        this.cycles += 5
    }

    // Store H and L direct
    //
    // ((byte3)(byte2)) <- (L)
    // ((byte3)(byte2) + 1) <- (H)
    //
    // The content of register `L` is moved to the memory location
    // whose address is specified in `byte2` and `byte3`. The content of
    // register `H` is moved to the succeeding memory location.
    shld() {
        const addr = to16(this.memory[this.pc + 2], this.memory[this.pc + 1])
        this.memory.splice(addr, 2, this.l, this.h)
        this.pc += 3
        this.cycles += 5
    }

    // Load accumulator indirect
    //
    // (A) <- ((rp))
    //
    // The content of the memory location, whose address is in
    // the register pair `rp`, is moved to register `A`. Note:
    // only register pairs `rp=B` (registers B and C) or `rp=D`
    // (registers D and E) may be specified.
    ldax(rp: RegisterPair) {
        this.a = this.memory[this.getrp(rp)]
        this.pc += 1
        this.cycles += 2
    }

    // Store accumulator indirect
    //
    // ((rp)) <- (A)
    //
    // The content of register `A` is moved the memory location
    // whose address is in the register pair `rp`. Note:
    // only register pairs `rp=B` (registers B and C) or `rp=D`
    // (registers D and E) may be specified.
    stax(rp: RegisterPair) {
        this.memory.splice(this.getrp(rp), 1, this.a)
        this.pc += 1
        this.cycles += 2
    }

    // Exchange H and L with D and E
    //
    // (H) <-> (D)
    // (L) <-> (E)
    //
    // The content of registers `H` and `L` are exchanged with
    // the contents of registers `D` and `E`.
    xchg() {
        [this.h, this.d] = [this.d, this.h];  //  - for fix ts warning
        [this.l, this.e] = [this.e, this.l]
        this.pc += 1
        this.cycles += 1
    }

    // ARITHMETIC GROUP
    //
    // This group of instructions performs arithmetic operations
    // on data in registers and memory.
    // Unless indicated otherwise, all instructions
    // in this group affect the Zero, Sign, Parity, Carry,
    // and Auxiliary Carry flags according to the standard rules.
    // All subtraction operations are performed via two's
    // complement arithmetic and set the carry flag to
    // indicate a borrow and clear it to indicate no borrow.

    // Not real instruction, used like helper for
    // another "add" group instruction.
    _change(result: number) {
        this.flags = upZSPC(this.flags, result)
        this.a = to8(result)
    }

    _add(v: number = 1, carry: number = 0) {
        const result = this.a + v + carry

        const index = ((this.a & 0x88) >> 1) | ((v & 0x88) >> 2) | ((result & 0x88) >> 3)

        this.flags = setclrb(this.flags, FlagsIndex.AxCarry, Boolean(halfAarryTable[index & 0x7]))

        this._change(result)
    }

    // Not a real instruction, used like helper for
    // another "sub" group instructions.
    _sub(value: number = 1, carry: number = 0) {
        const result = (this.a - value - carry) & 0xffff

        console.log("A:", this.a, "V:", value, "C:", carry, "RE:", result)

        const index = ((this.a & 0x88) >> 1) | ((value & 0x88) >> 2) | ((result & 0x88) >> 3)

        this.flags = setclrb(this.flags, FlagsIndex.AxCarry, !subHalfCarryTable[index & 0x7])

        this._change(result)
    }

    // Add register
    //
    // (A) <- (A) + (r)
    //
    // The content of register `r` is added to the content of
    // the accemulator. The result is placed in accumulator.
    add(r: Register) {
        this._add(this.getr(r))
        this.pc += 1
        this.cycles += 1
    }

    // Add memory
    //
    // (A) <- (A) + ((H)(L))
    //
    // The content of the memory location whose address is contained
    // in the `H` and `L` registers is added to the content of the
    // accumulator. The result is place in the accumulator.
    addm() {
        this._add(this.memhl)
        this.pc += 1
        this.cycles += 2
    }

    // Add immediate
    //
    // (A) <- (A) + (byte2)
    //
    // The content of the second byte of the instruction is
    // added to the content of the accumulator. The result
    // is placed in the accumulator.
    adi() {
        this._add(this.memory[this.pc + 1])
        this.pc += 2
        this.cycles += 2
    }

    // Add Register with carry
    //
    // (A) <- (A) + (r) + (C)
    //
    // The content of register `r` and the content of the carry
    // bit are added to the content of the accumulator. The
    // result is placed in the accumulator.
    adc(r: Register) {
        this._add(this.getr(r), this.flagCY ? 1 : 0)
        this.pc += 1
        this.cycles += 1
    }

    // Add memory with carry
    //
    // (A) <- (A) + ((H)(L)) + (C)
    //
    // The content of the memory location whose address is
    // contained is the `H` and `L` registers and the
    // content of the `C` flag are added to the accumulator.
    // The result is placed in the accumulator.
    adcm() {
        this._add(this.memhl, this.flagCY ? 1 : 0)
        this.pc += 1
        this.cycles += 2
    }

    // Add immediate with carry
    //
    // (A) <- (A) + (byte2) + (C)
    //
    // The content of the second byte of the instruction and
    // the content of the `C` flag are added to the contents
    // of the accumulator. The result is placed in the
    // accumulator.
    aci() {
        this._add(this.memory[this.pc + 1], this.flagCY ? 1 : 0)
        this.pc += 2
        this.cycles += 2
    }

    // Substract Register
    //
    // (A) <- (A) - (r)
    //
    // The content of register `r` is substructed from the content
    // of the accumulator. The result is placed in the accumulator.
    sub(r: Register) {
        this._sub(this.getr(r))
        this.pc += 1
        this.cycles += 1
    }

    // Substruct memory
    //
    // (A) <- (A) - ((H)(L))
    //
    // The content of memory location whose address is
    // contained in the `H` and `L` registers is substructed
    // from the content of the accumulator. The result is
    // placed in the accumulator.
    subm() {
        this._sub(this.memhl)
        this.pc += 1
        this.cycles += 1
    }

    // Subscturct immediate
    //
    // (A) <- (A) - (byte2)
    //
    // THe content of second byte of the instruction is
    // substructed from the content of the accumulator.
    // The result is placed in the accumulator.
    sui() {
        this._sub(this.memory[this.pc + 1])
        this.pc += 2
        this.cycles += 2
    }

    // Subscruct Register with corrow
    //
    // (A) <- (A) - (r) - (C)
    //
    // The content of register `r` and the content of the
    // `C` flag are both substructed from the accumulator.
    // The result is placed in the accumulator.
    sbb(r: Register) {
        this._sub(this.getr(r), this.flagCY ? 1 : 0)
        this.pc += 1
        this.cycles += 1
    }

    // Substruct memory with borrow
    //
    // (A) <- (A) - ((H)(L)) - (C)
    //
    // The content of the memory location whose address is
    // containded in the `H` and `L` registers and the
    // content of the `C` flag are both substructed from
    // the accumulator. The result is placed in the accumulator.
    sbbm() {
        this._sub(this.memhl, this.flagCY ? 1 : 0)
        this.pc += 1
        this.cycles += 1
    }

    // Substruct immediate with borrow
    //
    // (A) <- (A) - (byte2) - (C)
    //
    // The contents of the second byte of the instruction and
    // the content of the `C` flag are both substructed
    // from accumulator. The result is placed in the accumulator.
    sbi() {
        this._sub(this.memory[this.pc + 1], this.flagCY ? 1 : 0)
        this.pc += 2
        this.cycles += 2
    }

    // Increment Register
    //
    // (r) <- (r) + 1
    //
    // The content of resiger r is incremented by one.
    // Note: All condition flags except `C` are affected.
    inr(r: Register) {
        const result = this.getr(r) + 1

        const index = ((this.a & 0x88) >> 1) | ((this.getr(r) & 0x88) >> 2) | ((result & 0x88) >> 3)

        halfAarryTable[index & 0x7] ? setb(this.flags, FlagsIndex.AxCarry) : clrb(this.flags, FlagsIndex.AxCarry)

        this.flags = upZSPC(this.flags, result, false)

        this.setr(r, result)

        this.pc += 1
        this.cycles += 1
    }

    // Increment memory
    //
    // ((H)(L) <- ((H)(L)) + 1
    //
    // The content of the memory location whose address
    // is containded in the `H` and `L` registers is incremented
    // by one. Note: All condition flags except `C` are affected.
    inrm() {
        const result = this.memhl + 1

        const index = ((this.a & 0x88) >> 1) | ((this.memhl & 0x88) >> 2) | ((result & 0x88) >> 3)

        halfAarryTable[index & 0x7] ? setb(this.flags, FlagsIndex.AxCarry) : clrb(this.flags, FlagsIndex.AxCarry)

        this.flags = upZSPC(this.flags, result, false)

        this.memhl = result

        this.pc += 1
        this.cycles += 3
    }

    // Decrement Register
    //
    // (r) <- (r) - 1
    //
    // the content of register `r` is recremented by one.
    // Note: All condition flags except `C` are affected.s
    dcr(r: Register) {
        const result = this.getr(r) - 1

        const index = ((this.a & 0x88) >> 1) | ((this.getr(r) & 0x88) >> 2) | ((result & 0x88) >> 3)

        !subHalfCarryTable[index & 0x7] ? setb(this.flags, FlagsIndex.AxCarry) : clrb(this.flags, FlagsIndex.AxCarry)

        this.flags = upZSPC(this.flags, result, false)

        this.setr(r, result)

        this.pc += 1
        this.cycles += 1
    }

    // Decrement memory
    //
    // ((H)(L)) <- ((H)(L)) - 1
    //
    // The content of the memory location whose address is
    // contained in the `H` and `L` registers is decremented by
    // one. Note: All conditiona flags except `C` are affected.
    dcrm() {
        const result = this.memhl - 1

        const index = ((this.a & 0x88) >> 1) | ((this.memhl & 0x88) >> 2) | ((result & 0x88) >> 3)
        !subHalfCarryTable[index & 0x7] ? setb(this.flags, FlagsIndex.AxCarry) : clrb(this.flags, FlagsIndex.AxCarry)

        this.flags = upZSPC(this.flags, result, false)

        this.memhl = result

        this.pc += 1
        this.cycles += 3
    }

    // Increment register pair
    //
    // (rh)(rl) <- (rh)(rl) + 1
    //
    // The content of the register pair `rp` is incremented by one.
    // Note: No condition flags are affected.
    inx(rp: RegisterPair) {
        this.setrp(rp, ...from16(this.getrp(rp) + 1))
        this.pc += 1
        this.cycles += 1
    }

    // Decrement register pair
    //
    // (rh)(rl) <- (rh)(rl) + 1
    //
    // The content of the register pair `rp` is decremented by one.
    // Note: No condition flags are affected.
    dcx(rp: RegisterPair) {
        this.setrp(rp, ...from16(this.getrp(rp) - 1))
        this.pc += 1
        this.cycles += 1
    }

    // Add register pair to H and L
    //
    // (H)(L) <- (H)(L) + (rh)(rl)
    //
    // The content of the register pair `rp` is added to the content
    // of the register pair `H` and `L`. The result is placed in the
    // register pair `H` and `L`. Note Only the `C` flag is affected.
    // It is set if there is a carry out of the double percision add,
    // otherwise it is reset.
    dad(rp: RegisterPair) {
        const result = this.hl + this.getrp(rp)

        if (result & 0x10000) {
            setb(this.flags, FlagsIndex.Carry)
        } else {
            clrb(this.flags, FlagsIndex.Carry)
        }
        this.setrp(RegisterPair.H, high(result), low(result))
        this.pc += 1
        this.cycles += 3
    }

    // Decimal Adjust Accumulator
    //
    // The eight-bit number in the accumulator is adjusted
    // to form two four-bit Binary-Coded-Decimal digits by
    // The following process:
    //  1. If the value of the least significant 4 bits of the
    //     accumulator is greater than 9 or if the `AC` flag is
    //     set, 6 is added to the accumulator.
    //  2. If the value of the most significant 4 bits of the
    //     accumulator is greater than 9 or if the `C` flag is
    //     set 6 is added to the most significant 4 bits of
    //     the accumulator
    //
    // Note: All flags are affected.
    daa() {
        const axc = this.flags & Flags.AxCarry
        const carry = this.flags & Flags.Carry
        let add = 0

        if (axc || (this.a & 0xf) > 9) add = 6
        if (carry || (this.a >> 4) > 9) add |= 6

        this._add(add)
        this.pc += 1
        this.cycles += 1
    }

    // LOGIC GROUP
    //
    // This group of instructions performs logical (boolean)
    // operations on data in registers and memory and on
    // condition flags. Unless indicated otherwise, all
    // instructions in this group affect the Zero, Sign, Parity,
    // Auxiliary Carry, and Carry flags according to the standard rules.

    // AND Register
    //
    // (A) <- (A) & (r)
    //
    // The content of register `r` is logically added with the content
    // of the accumulator. The result is placed in the accumulator.
    // The `C` flag is cleared.
    ana(r: Register) {
        this.a = this.a & this.getr(r)
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        this.pc += 1
        this.cycles += 1
    }

    // AND memory
    //
    // (A) <- (A) & ((H)(L))
    //
    // The contents of the memory location whose address is contained
    // in the `H` and `L` registers is logically added with the
    // content of the accumulator. The result is placed in the
    // accumulator. The `C` flag is cleared.
    anam() {
        this.a = this.a & this.memhl
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        this.pc += 1
        this.cycles += 2
    }

    // AND immediate
    //
    // (A) <- (A) & (byte2)
    //
    // The content of the second byte of the instruction is
    // logically added with the contents of the accumulator.
    // The result is placed in the accumulator. The `C` and
    // `AC` flags are cleared.
    ani() {
        this.a = this.a & this.memory[this.pc + 1]
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 2
        this.cycles += 2
    }

    // Exclusive OR Register
    //
    // (A) <- (A) ^ (r)
    //
    // The content of register `r` is exclusive-or with the
    // content of the accumulator. The result is placed
    // in the accumulator. The `C` and `AC` flags are cleared.
    xra(r: Register) {
        this.a = this.a ^ this.getr(r)
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 1
        this.cycles += 1
    }

    // Exclusive OR memory
    //
    // (A) <- (A) ^ ((H)(L))
    //
    // The content of the memory location whose address is
    // contained in the `H` and `L` registers is exclusive-or
    // with the content of the accumulator. The result is
    // placed in the accumulator. The `C` and `AC` flags are
    // cleared
    xram() {
        this.a = this.a ^ this.memhl
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 1
        this.cycles += 2
    }

    // Exclusive OR immediate
    //
    // (A) <- (A) ^ (byte2)
    //
    // The content of the second byte of the instruction is
    // exclusive-or with the content of the accumulator.
    // The result is placed in the accumulator. The
    // `C` and `AC` flags are cleared.
    xri() {
        this.a = this.a ^ this.memory[this.pc + 1]
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 2
        this.cycles += 2
    }

    // OR register
    //
    // (A) <- (A) || (R)
    //
    // The content of register `r` is inclusive-or with the
    // content of the accumulator. The result is placed in
    // the accumulator. The `C` and `AC` flags are cleared.
    ora(r: Register) {
        this.a = this.a | this.getr(r)
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 1
        this.cycles += 1
    }

    // OR memory
    //
    // (A) <- (A) || ((H)(L))
    //
    // The content of the memory location whose address is
    // contained in the `H` and `L` registers in inclusive-or
    // with the content of the accumulator. The result is placed
    // in the accumulator. The `C` and `AC` flags are cleared.
    oram() {
        this.a = this.a | this.memhl
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 1
        this.cycles += 2
    }

    // OR immediate
    //
    // (A) <- (A) || (byte 2)
    //
    // The content of the `(byte 2)` of the instruction is
    // inclusive-or with the content of the accumulator.
    // The result is placed in the accumulator. The `C` and
    // `AC` flags ares cleared.
    ori() {
        this.a = this.a | this.memory[this.pc + 1]
        this.flags = upZSPC(this.flags, this.a)
        clrb(this.flags, Flags.Carry)
        clrb(this.flags, Flags.AxCarry)
        this.pc += 2
        this.cycles += 2
    }

    // Compare Register
    //
    // (A) - (r)
    //
    // The content of register `r` is substructed from the
    // accumulator. The accumulator remains unchanged. THe
    // condition flags are set as a result of the substruction.
    //
    // The `Z` flag is set to ` if (A)=(r). The `C` flags is set
    // to 1 if (A)<(r)
    cmp(r: Register) {
        let a = this.a
        this._sub(this.getr(r))
        this.a = a
        this.pc += 1
        this.cycles += 1
    }

    // Compare memory
    //
    // (A) - ((H)(L))
    //
    // The content of the memory location whose address is
    // contained in the `H` and `L` registers is substructed
    // from the accumulator. The accumulator remains unchanged.
    // The condition flags are set as result of the substruction.
    // The `Z` flag is set to ` if (A)=((H)(L)). The `C` flag is
    // set to 1 if (A)<((H)(L))
    cmpm() {
        let a = this.a
        this._sub(this.memhl)
        this.a = a
        this.pc += 1
        this.cycles += 1
    }

    // Compare immediate
    //
    // (A) - (byte 2)
    //
    // The content of the second byte of the instruction is
    // substructed from the accumulator. The condition flags
    // are set by the result of the substruction. The `Z` flag
    // is set to 1 if (A)=(byte 2). The `C` flag is set to 1
    // if (A)<(byte 2)
    cpi() {
        const result = this.a - this.memory[this.pc + 1]
        if (result === 0) {
            setb(this.flags, FlagsIndex.Zero)
        } else if (result < 0) {
            setb(this.flags, FlagsIndex.Carry)
        }
        this.pc += 2
        this.cycles += 2
    }

    // Rotate left
    //
    // The content of the accumulator is rotated left one position.
    // The low order bit and the `CY` flag are both set to the
    // value shifted out of the high order bit position. Only
    // the `CY` flag is affected.
    rlc() {
        let t = this.a << 1
        if (t & OverBit) {
            setb(t, 0)
            setb(this.flags, FlagsIndex.Carry)
        } else {
            clrb(t, 0)
            clrb(this.flags, FlagsIndex.Carry)
        }
        this.a = t
        this.pc += 1
        this.cycles += 1
    }

    // Rotate Right
    //
    // The content of the accumulator is rotated right one position.
    // The high order bit and the `CY` flag are both set to the
    // value shifted out of the low order bit position. Only
    // the `CY` flag is affected.
    rrc() {
        let t = this.a >> 1
        if (t & 1) {
            setb(t, 7)
            setb(this.flags, FlagsIndex.Carry)
        } else {
            clrb(t, 0)
            clrb(this.flags, FlagsIndex.Carry)
        }
        this.a = t
        this.pc += 1
        this.cycles += 1
    }

    // Rotate left through Flags.Carry
    //
    // (An+1) <- (An) (CY) <- (A7)
    // (A0) <- (CY)
    //
    // The content of the accumulator is rotated left one
    // position through the `CY` flag. The low order bit is
    // set to the `CY` flag and the `CY` flag is set to the value
    // shifted out of the high order bit. Only the `CY` flag is affected.
    ral() {
        let t = this.a << 1
        if (this.flagCY) {
            setb(this.a, 0)
        }
        if (t & OverBit) {
            this.flagCY = true
        }
        this.a = t
        this.pc += 1
        this.cycles += 1
    }

    // Rotate right through Flags.Carry
    //
    // (An) <- (An+1) (CY) <- (A0)
    // (A7) <- (CY)
    //
    // The content of the accumulator is rotated right one
    // position through the `CY` flag. The high order bit is
    // set to the `CY` flag and the `CY` flag is set to the value
    // shifted out of the low order bit. Only the `C` flag is affected.
    rar() {
        let bitCY = Boolean(this.a & 1)
        let t = this.a >> 1
        if (this.flagCY) {
            setb(t, 7)
        }
        this.flagCY = bitCY
        this.a = t
        this.pc += 1
        this.cycles += 1
    }

    // Complement accumulator
    //
    // (A) <- !(A)
    //
    // The contents of the accumulator are complemented.
    // No flags are affected.
    cma() {
        this.a = to8(this.a ^ 0xff)
        this.pc += 1
        this.cycles += 1
    }

    // Complement carry
    //
    // (C) <- !(C)
    //
    // The `C` flag is complemented. No other flags are affected.
    cmc() {
        this.flags = xorb(this.flags, FlagsIndex.Carry)
        this.pc += 1
        this.cycles += 1
    }

    // Set carry
    //
    // (C) <- 1
    //
    // The `C` flag is set to 1. No other flags are affected.
    stc() {
        this.flags = setb(this.flags, FlagsIndex.Carry)
        this.pc += 1
        this.cycles += 1
    }

    // BRANCH GROUP
    //
    // This group of instructions alter normal sequential program flow.
    // Condition flags are not affected by any instruction in this group.
    // The two types of branch instruction are unconditional and conditional.
    // Unconditional transfers simply perform the specified operation on
    // register `PC` (the program counter). Conditional transfers examine the
    // status of one of the four processor flags to determine if the specified
    // branch is to be executed. The conditions that may be specified
    // are as follows:
    //
    // CONDITIONS                 CCC
    // `NZ` - not zero (Z = 0)    000
    //  `Z` - zero (Z = 1)        001
    // `NC` - no carry (C = 0)    010
    //  `C` - carry (C = 1)       011
    // `PO` - parity odd (P = 0)  100
    // `PE` - parity even (P = 1) 101
    //  `P` - plus (S = 0)        110
    //  `M` - minus (S = 1)       111

    // Jump
    //
    // (PC) <- (byte3)(byte2)
    //
    // Control is transferred to the instruction whose
    // address is specified in `byte 3` and `byte 2` of
    // the current instruction.
    jmp() {
        this.pc = to16(this.memory[this.pc + 2], this.memory[this.pc + 1])
        this.cycles += 3
    }

    // Conditional jump
    //
    // if (CCC)
    //    (PC) <- (byte3)(byte2)
    //
    // If the specified conditional is true, control is transferred to
    // the instruction whose address is specified in `byte 3` and `byte 2`
    // of the current instruction, otherwise, control continues sequentially.
    jcond(c: number) {
        if (conditions.get(c)(this.flags)) {
            this.jmp()
        } else {
            this.pc += 3
            this.cycles += 3
        }
    }

    // Call
    //
    // ((SP) - 1) <- (PCH)
    // ((SP) - 2) <- (PCL)
    //  (SP) <- (SP) - 2
    //  (PC) <- (byte3)(byte2)
    //
    // The high-order eight bits of the next instruction address are
    // moved to the memory location whose address is one less than the
    // content of register `SP`. The low-order eight bits of the next
    // instruction address are moved to the memory location whose
    // address is two less than the content of register `SP`.
    // The content of register `SP` is decremented by 2. Control
    // is transferred to the instruction whose address is specified in
    // `byte 3` and `byte 2` of the current instruction.
    call() {
        const next = this.pc + 3
        this.memory.splice(this.sp - 2, 2, high(next), low(next))
        this.sp -= 2
        this.pc = to16(this.memory[this.pc + 2], this.memory[this.pc + 1])
        this.cycles += 5
    }

    // Condition call
    //
    // if (CCC)
    //    ((SP) - 1) <- (PCH)
    //    ((SP) - 2) <- (PCL)
    //     (SP) <- (SP) -2
    //     (PC) <- (byte3)(byte2)
    //
    // If the specified condition is true, the actions specified
    // in the `CALL` instruction are performed, otherwise
    // control continues sequentially.
    ccond(c: number) {
        if (conditions.get(c)(this.flags)) {
            this.call()
        } else {
            this.pc += 3
            this.cycles += 3
        }
    }

    // Return
    //
    // (PCH) <- ((SP))
    // (PCL) <- ((SP) + 1)
    // (SP) <- (SP) + 2
    //
    // The content of the memory location whose address is
    // specified in register `SP` is moved to the low-order
    // eight bits of register `PC`. The content of the memory
    // location whose address is one more than the content
    // of register `SP` is moved to the high-order eight bits
    // of register `PC`. The content of register `SP` is
    // incremented by 3.
    ret() {
        this.pc = to16(this.memory[this.sp], this.memory[this.sp + 1])
        this.sp += 2
        this.cycles += 3
    }

    // Conditional return
    //
    // if (CCC)
    //    (PCL) <- ((SP))
    //    (PCH) <- ((SP) + 1)
    //    (SP) <- (SP) + 2
    //
    // If the specified condition is true, the actions specified in
    // the `RET` instruction are performed, otherwise control
    // continues sequentially.
    rcond(c: number) {
        if (conditions.get(c)(this.flags)) {
            this.ret()
        } else {
            this.pc += 1
            this.cycles += 1
        }
    }

    // Restart
    //
    // ((SP) - 1) <- (PCH)
    // ((SP) - 2) <- (PCL)
    //  (SP) <- (SP) - 2
    //  (PC) <- 8 * (NNN)
    //
    // The high-order eight bits of the next instruction address are
    // moved to high memory location whose address is one less than the
    // content of register `SP`. The low-order eight bits of the next
    // instruction address are moved to the memory location whose
    // address is two less than the content of register `SP`. The content
    // of register `SP` is decremented by two. Control is transferred to
    // the instruction whose address is eight times the content of `NNN`.
    rst(n: number) {
        this.memory.splice(this.sp-1, 2, low(this.pc), high(this.pc))
        this.sp -= 2
        this.pc = 8 * n
        this.cycles += 3
    }

    // Jump H and L indirect - move H and L to PC
    // (PCH) <- (H)
    // (PCL) <- (L)
    //
    // The content of register `H` is moved to the high-order
    // eight bits of register `PC`. The content of register `L`
    // is moved to the low-order eight bits of register `PC`.
    pchl() {
        this.pc = to16(this.h, this.l)
        this.cycles += 1
    }

    // STACK, I/O AND MACHINE CONTROL GROUP
    //
    // This group of instruction performs I/O, manipulates
    // the Stack, and alters internal control flags.
    // Unless otherwise specified, condition flags are not
    // affected by any instruction in this group.

    // Push
    //
    // ((SP) - 1) <- (rh)
    // ((SP) - 2) <- (hl)
    //  (SP) <- (SP) - 2
    //
    // The content of the high-order register of register pair
    // `rp` is moved to the memory location whose address is one
    // less than the content of register `SP`. The content of the
    // low-order register of register pair `rp` is moved to the
    // memory location whose address is two less than the content
    // of register `SP`. The content of register `SP` is decremented by 2.
    // Note: Register pair `rp=SP` may not be specified.
    push(rp: RegisterPair) {
        this.memory.splice(this.sp - 2, 2, low(this.getrp(rp)), high(this.getrp(rp)))
        this.sp -= 2
        this.pc += 1
        this.cycles += 3
    }

    // Push processor status word
    //
    // The content of register `A` is moved to the memory location
    // whose address is one less than register `SP`. The contents
    // of the condition flags are assembled into a processor
    // status word and the word is moved to the memory location
    // whose address is two less than the content of register `SP`.
    // The content of register `SP` is increment by two.
    pushpsw() {
        this.memory.splice(this.sp - 2, 2, this.flags, this.a)
        this.pc += 1
        this.cycles += 3
    }

    // Pop
    //
    // (rl) <- ((SP))
    // (rh) <- ((SP) + 1)
    // (SP) <- (SP) + 2
    //
    // The content of the memory location, whose address
    // is specified by the content of register `SP`, is moved
    // to the low-order register of register pair `rp`. The
    // content of the memory location , whose address is one
    // more that the content of register `SP`, is moved to
    // the high-order register of register pair `rp`. The
    // content of register `SP` is incremented by 2.
    // Note: Register pair `rp=SP` may not be specified.
    pop(rp: RegisterPair) {
        this.setrp(rp, this.memory[this.sp], this.memory[this.sp + 1])
        this.sp += 2
        this.pc += 1
        this.cycles += 3
    }

    // Pop processor status word
    //
    // The content of the memory location whose address
    // is specified by the content of register `SP` is used
    // to restore the condition flags. The content of the memory
    // location those address is one more than the content of
    // register `SP` is moved to register `A`. The content of
    // register `SP` is incremented by 2.
    poppsw() {
        this.flags = this.memory[this.sp]
        this.a = this.memory[this.sp + 1]
        this.pc += 1
        this.cycles += 3
    }

    // Exchange stack top with H and L
    //
    // (L) <-> ((SP))
    // (H) <-> ((SP) + 1)
    //
    // The content of the `L` register is exchanged with the content
    // of the memory location whose address is specified by the content
    // of register `SP`. The content of the `H` register is exchanged with
    // the content of the memory location whose address is one more than
    // the content of register `SP`.
    xthl() {
        // todo: fix vue bug
        // [this.l, this.memory[this.sp]] = [this.memory[this.sp], this.l];
        // [this.h, this.memory[this.sp + 1]] = [this.memory[this.sp + 1], this.h]
        this.pc += 1
        this.cycles += 5
    }

    // Input
    //
    // (A) <- (data)
    //
    // The data placed on the eight bit bi-directional data
    // bus by the specified port is moved to register `A`.
    in() {
        this.a = this.io[this.memory[this.pc + 1]]
        this.pc += 2
        this.cycles += 3
    }

    // Output
    //
    // (data) <- (A)
    //
    // The content of register `A` is placed on the eight bit
    // bi-directional data bus for transmission to the
    // specified port.
    out() {
        this.io.splice(this.memory[this.pc + 1], 1, this.a)
        this.pc += 2
        this.cycles += 3
    }

    // Enable interrupts
    //
    // The interrupt system is enabled following the
    // execution of the next instruction.
    ei() {
        this.pc += 1
        this.isInterruptEnabled = true
        this.cycles += 1
    }

    // Disable interrupts
    //
    // The interrupt system is disabled immediately
    // following the execution of the `DI` instruction.
    di() {
        this.pc += 1
        this.isInterruptEnabled = false
        this.cycles += 1
    }

    // Halt
    //
    // The processor is stopped. The registers and flags are unaffected.
    hlt() {
        if (this.V) console.log("HALT", "PC:", this.pc)

        this.state = State.Halted

        clearInterval(this.interval)

        this.cycles += 1
    }

    // No op
    //
    // No operation is performed. The registers and flags are unaffected.
    nop() {
        this.pc += 1
        this.cycles += 1
    }
}
