import {Rule, Token} from "./scanner"
import {AssemblerError}  from "./errors"

describe("errors", () => {
    test("assembler error must set correct line/start/end from token", () => {
        const t: Token = {rule: Rule.Id, lexeme: "MOVA", line: 2, start: 3, end: 7}

        const err = new AssemblerError("undefined instruction MOVA", t)

        expect(err.line).toBe(t.line)
        expect(err.start).toBe(t.start)
        expect(err.end).toBe(t.end)
    })
})
