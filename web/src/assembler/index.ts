import {from16} from "@/libs/bitwise"

import {AssemblerError} from "./errors"
import {macro} from "./macro"
import {Opcodes} from "./opcodes"
import {scan, Rule, Rules, Token} from "./scanner"
import {ast} from "./syntax"

import {Context, db, ds, dw, evaluate} from "./eval"
import {fix} from "@/assembler/fix";

export {assemble, Executable}

const formatArgs = (args: Array<Token>) => args.map(t => t.lexeme).join(", ")

// check - check if value not ... in bits-bit
// number, raise error with passed token.
const check = (value: number, bits: number, t: Token): number => {
    const max = Math.pow(2, bits) - 1

    if (value > max) {
        throw new AssemblerError(`max value ${max}, got ${value}`, t)
    }

    return value
}

// Executable - special structure (like elf/exe files), represents
// result of assembling. Binary representation of program plus debug
// information.
interface Executable {
    // Binary section
    text: Array<number>

    // Debug section, index of array it's index of
    // opcode in the text field of Executable, value
    // it's line of this instruction in source code
    debug: Array<number>
}

// assemble - take a source code and assemble (compile) to Executable
//
// Usage:
//    >>> const text = `
//        DI   Commentary on second line
//        HLT  instruction on third line
//    `
//    >>> const f = assemble(text)
//    >>> console.log(f)
//    {
//        bin: [21, 76], // Compiled opcode of HLT inst
//        map: [2, 3]    // 0 index inst DI on second source line, 1 index inst HLT on third line
//    }
//
// Assembling Pipeline:
//    Format: (INPUT DATA) -> Stage name -> (OUTPUT DATA)
//
//    (Text, Rules) -> Scanner            -> (Tokens)
//    (Tokens)      -> Syntax             -> (AST)
//    (AST)         -> Macro              -> (AST)
//    (AST)         -> Evaluator/Code-gen -> (Executable)
//
// If any error occurred raise AssemblerError with context
// information (error message, line number, start and end
// position of error if available.
//
const assemble = (text: string): Executable => {

    // todo: move to syntax stage
    text += "\n"

    const templateArray: Array<number> = new Array(65536).fill(0)

    const ctx = new Context()

    const exe: Executable = {
        text: [...templateArray],
        debug: [...templateArray],
    }

    // Insert bytes to resulting binary value
    const insert = (line: number, ...bytes: Array<number>) => {

        if (ctx.counter + bytes.length >= Math.pow(2, 16)) {
            throw new AssemblerError(`INTERNAL ERROR, not enough memory for insert ${bytes}`, {rule: Rule.Id, lexeme: "", line: line, start: 0, end: 1})
        }

        // we detect if number > 8-bit number, we
        // don't see this error, calling code must
        // send only 8-bit numbers in bytes array.
        bytes.forEach(u => { 
            if (u > 255) {
                throw new AssemblerError(`INTERNAL ERROR ${u} too big for 8-bit number`, {rule: Rule.Id, lexeme: "", line: line, start: 0, end: 1}) 
            }
        })

        exe.text.splice(ctx.counter, bytes.length, ...bytes)

        ctx.counter += bytes.length
    }

    // Construct object file. Insert debug information
    // and insert bytes into resulting binary.
    const construct = (line: number, ...bytes: Array<number>) => {
        exe.debug.splice(ctx.counter, bytes.length, line)

        insert(line, ...bytes)
    }

    // todo: refactor to deferred evaluation
    // todo: labels must be tokens in ctx.unresolved, for raising error with context.
    const resolve = () => {
        for (const [t, base] of ctx.unresolved.entries()) {
            if (!ctx.addrs.has(t.lexeme)) throw new AssemblerError(`can not find ${t.lexeme} label`, t)

            console.log("RESOLVE", t, base, ctx.addrs)

            // Base - opcode address
            // We replace 2 next bytes with real address of label
            exe.text.splice(base + 1, 2, ...from16(ctx.addrs.get(t.lexeme)).reverse())
        }
    }

    // Disabling assembler for part of program (with IF, ENDIF pseudo instructions).
    let off = false

    loop: for (const {labels, mnemonic, ops} of macro(ast(scan(text, Rules)))) {

        // Construct label to address links (except EQU and SET pseudo instructions)
        // todo: N1
        // todo: make EQU, SET labels not labels on lexer/syntax stages,
        // todo: create new type of tokens - "names", example usage:
        // todo: for (const {labels, names, mnemonic, ops} of ...) { ... }
        if (mnemonic.lexeme !== "EQU" && mnemonic.lexeme !== "SET") {
            labels.forEach((t: Token) => {
                if (ctx.addrs.has(t.lexeme)) throw TypeError(`label ${t} duplicate defined`)

                // slice drop ":" at end of label
                ctx.addrs.set(t.lexeme.slice(0, -1), ctx.counter)
            })
        }

        // Copy first and second operands as special vars
        // for fast access in common cases.
        const [dst, src] = ops

        // IF/ENDIF pseudo instructions must be processed at first,
        //    because it influence on assembling process.
        switch (mnemonic.lexeme) {
            case "IF":
                off = Boolean(evaluate(ctx, dst))
                break

            case "ENDIF":
                off = false
                break
        }

        if (off) continue

        const [op, args] = Opcodes.get(mnemonic.lexeme, [0, 0])

        if (op !== 0 && ops.length !== args) {
            throw new AssemblerError(`${mnemonic.lexeme} inst required ${args} arguments, got ${ops.length}: ${formatArgs(ops)}`, mnemonic.lexeme)
        }

        const l = mnemonic.line

        switch (mnemonic.lexeme) {
            default:
                throw new AssemblerError(`undefined instruction ${mnemonic.lexeme}`, mnemonic)

            // ==== DATA INSTRUCTIONS ====================== //

            case "DB":
                ops.map((t: Token) => insert(l, ...db(ctx, t)))
                break

            case "DW":
                ops.map((t: Token) => insert(l, ...dw(ctx, t)))
                break

            case "DS":
                insert(l, ...ds(ctx, dst))
                break

            // ==== PSEUDO INSTRUCTIONS ==================== //

            case "ORG":
                ctx.counter = check(evaluate(ctx, dst), 16, dst)
                break

            case "EQU":
                // todo: see "todo: N1", after that will be "names.map(...)"
                labels.map((t: Token) => {
                    if (ctx.values.has(t.lexeme)) {
                        throw new AssemblerError(`EQU "${t.lexeme}" symbol can not be redefined`, t)
                    }

                    ctx.values.set(t.lexeme.slice(0, -1), evaluate(ctx, dst))
                })
                break

            case "SET":
                // todo: see "todo: N1", after that will be "names.map(...)"
                labels.map((label: Token) => ctx.values.set(label.lexeme, evaluate(ctx, dst)))
                break

            case "END":
                break loop

            // ==== REAL INSTRUCTIONS ====================== //

            case "MOV":
                construct(l, op | (check(evaluate(ctx, dst), 3, dst) << 3) | check(evaluate(ctx, src), 3, src))
                break

            case "MVI":
                construct(l, op | (check(evaluate(ctx, dst), 3, dst) << 3), check(evaluate(ctx, src), 8, src))
                break

            case "LXI":
                construct(l, op | (check(fix(evaluate(ctx, dst)), 2, dst) << 4), ...from16(check(evaluate(ctx, src), 16, src)).reverse())
                break

            case "ADD":
            case "ADC":
            case "SUB":
            case "SBB":
            case "ANA":
            case "XRA":
            case "ORA":
            case "CMP":
                construct(l, op | check(evaluate(ctx, dst), 3, dst))
                break

            case "ACI":
            case "ADI":
            case "SUI":
            case "SBI":
            case "ANI":
            case "XRI":
            case "ORI":
            case "CPI":
            case "RST":
            case "IN":
            case "OUT":
                construct(l, op, check(evaluate(ctx, dst), 8, dst))
                break

            case "INR":
            case "DCR":
                construct(l, op | check(evaluate(ctx, dst), 3, dst) << 3)
                break

            case "LDAX":
            case "STAX":
            case "INX":
            case "DCX":
            case "DAD":
            case "PUSH":
            case "POP":
                construct(l, op | check(fix(evaluate(ctx, dst)), 2, dst) << 4)
                break

            case "LDA":
            case "STA":
            case "LHLD":
            case "SHLD":
                construct(l, op, ...from16(check(evaluate(ctx, dst), 16, dst)).reverse())
                break

            case "JMP":
            case "JNZ":
            case "JZ":
            case "JNC":
            case "JC":
            case "JPO":
            case "JPE":
            case "JP":
            case "JM":
            case "CALL":
            case "CNZ":
            case "CZ":
            case "CNC":
            case "CC":
            case "CPO":
            case "CPE":
            case "CP":
            case "CM":
                // set defer to true, only this evaluation can be deferred
                construct(l, op, ...from16(check(evaluate(ctx, dst, true), 16, dst)).reverse())
                break

            case "DAA":
            case "XCHG":

            case "RLC":
            case "RRC":
            case "RAL":
            case "RAR":
            case "CMA":
            case "CMC":
            case "STC":

            case "RET":
            case "RNZ":
            case "RZ":
            case "RNC":
            case "RC":
            case "RPO":
            case "RPE":
            case "RP":
            case "RM":

            case "PCHL":
            case "XTHL":
            case "SPHL":
            case "EI":
            case "DI":
            case "HLT":
            case "NOP":
                construct(l, op)
                break
        }
    }

    resolve()

    return exe
}
