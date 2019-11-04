import {example} from "./index"

export {intro}

let text = `
            ; Hi, Brave Cats!

            ; It's Intel 8080 Assembler & Emulator
            ; Program example with loop

            MVI     C,  10h

    LOOP:
            NOP             ; Process some operations

            DCR     C
            JNZ     LOOP    ; Jump if C non zero

    END:
            JMP     END
`

const intro: example = {
    text: text,
    name: "INTRO",
    description: "Introduction example",
}
