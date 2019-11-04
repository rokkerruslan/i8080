import {example} from "@/examples/index"

export {memset}

let text = `

;       NAME:       MEMSET
;
;       GOAL:       FILLS THE MEMORY AREA WITH A GIVEN VALUE
;
;       INPUT:      H - HIGH BYTE OF BASE ADDRESS
;                   L -  LOW BYTE OF BASE ADDRESS
;                   D - HIGH BYTE OF MEMORY SIZE
;                   E -  LOW BYTE OF MEMORY SIZE
;                   A - VALUE TO FILL


                JMP     MAIN

MEMSET:
                MOV     C,  A
        LOOP:
                MOV     M,  C
                INX     H
                DCX     D
                MOV     A,  E
                ORA     D
                JNZ     LOOP
                RET

MAIN:
                LXI     SP,     FFFFH

                LXI     H,      4000H   ; base
                LXI     D,      10H     ; count
                MVI     A,      AAH     ; value
                CALL    MEMSET
    
                HLT
`

const memset: example = {
    text: text,
    name: "MEMSET",
    description: "Fills the memory area with a given value",
}
