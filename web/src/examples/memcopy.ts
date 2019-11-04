import {example} from "./index"

export {memcopy}

let text = `
;       NAME:       MEMCOPY
;
;       GOAL:       COPY THE MEMORY AREA TO OTHER MEMORY AREA
;   
;       WARNING:    AREAS MUST NOT INTERSECTION (UNDEFINED BEHAVIOR)
;
;       INPUT:      H - HIGH BYTE OF SOURCE ADDRESS
;                   L -  LOW BYTE OF SOURCE ADDRESS
;                   D - HIGH BYTE OF TARGET ADDRESS
;                   E -  LOW BYTE OF TARGET ADDRESS
;                   B - HIGH BYTE OF COUNT BYTES FOR COPY
;                   C -  LOW BYTE OF COUNT BYTES FOR COPY

                JMP     MAIN

MEMCOPY:
                ; Return if count is 0
                MOV     A,  B
                ORA     C
                RZ

        LOOP:
                MOV     A,  M   ; Take next byte
                STAX    D       ; Copy to target address
                INX     H       ; Increment source address
                INX     D       ; Increment target address
                DCX     B       ; Decrement counter

                MOV     A,  B
                ORA     C
                JNZ     LOOP
                
                RET

MAIN:
                LXI     SP, FFFFH       ; Setup stack pointer

                ; Copy part of executable in middle of memory
                LXI     H,  0H
                LXI     D,  4000H
                LXI     B,  20H
                CALL    MEMCOPY

                HLT
`

const memcopy: example = {
    text: text,
    name: "MEMCOPY",
    description: "Copy n-bytes from source address to target address",
}
