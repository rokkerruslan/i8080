import {Token} from "./scanner"

export {AssemblerError}

class AssemblerError extends Error {
    line: number
    start: number
    end: number

    constructor(message: string, t: Token) {
        super(message)

        this.message = message
        this.line = t.line
        this.start = t.start
        this.end = t.end
    }
}
