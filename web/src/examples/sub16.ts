import {example} from "./index"

export {sub16}

let text = `

;       NAME:       MEMSET
;
;       GOAL:       FILLS THE MEMORY AREA WITH A GIVEN VALUE
;
;       INPUT:      H - HIGH BYTE OF BASE MINUEND
;                   L -  LOW BYTE OF BASE MINUEND
;                   D - HIGH BYTE OF MEMORY SUBTRAHEND
;                   E -  LOW BYTE OF MEMORY SUBTRAHEND
;
;       OUTPUT:
;                   H - HIGH BYTE OF DIFFERENCE
;                   L -  LOW BYTE OF DIFFERENCE

                JMP     MAIN

SUB16:
                MOV     A,  L
                SUB     E
                MOV     L,  A
                MOV     A,  H
                SBB     D
                MOV     H,  A
                RET

MAIN:
                LXI     SP,     FFFFH

                LXI     H,      40A0H
                LXI     D,      1020H   
                CALL    SUB16

                HLT
`

const sub16: example = {
    text: text,
    name: "16-BIT SUB",
    description: "16-bit substruction and use carry for 17-bit",
}
