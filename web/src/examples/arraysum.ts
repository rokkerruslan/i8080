import {example} from "./index"

export {arraysum}

let text = `
;       NAME:       ASUM8
;
;       GOAL:       SUM ELEMENTS OF 8-BIT ARRA&
;
;       INPUT:      H - HIGH BYTE OF BASE ADDRESS
;                   L -  LOW BYTE OF BASE ADDRESS
;                   B - ARRAY SIZE IN BYTES (256 ELEMENTS MAX)
;       
;       OUTPUT:     H - HIGH BYTE OF SUM
;                   L -  LOW BYTE OF SUM

                JMP     MAIN

ASUM8:
                XCHG            ; Save base address of array
                LXI     H,  0   ; Initial value

                MOV     A,  B
                ORA     A
                RZ              ; Return if array len is zero
                
                XCHG            ; Set H and L back for base address
                
                MVI     A,  0   ; A - low byte of sum, D - high byte of sum
                
        LOOP:
                ADD     M
                JNC     NEXT
                INR     D
                
        NEXT:
                INX     H
                DCR     B
                JNZ     LOOP
                
                MOV     L,  A
                MOV     H,  D
                RET

SIZE:           EQU     6
BUFSIZE:        DB      SIZE

BUF:
                DB      00H     ; 0
                DB      11H     ; 17
                DB      22H     ; 34
                DB      33H     ; 51
                DB      44H     ; 68
                DB      55H     ; 85

MAIN:
                LXI     SP, FFFFH

                LXI     H,  BUF
                LDA     BUFSIZE
                MOV     B,  A
                CALL    ASUM8

                HLT

`

const arraysum: example = {
    text: text,
    name: "ASUM16",
    description: "Sum elements of 8-bit array",
}
