
        MVI A, 100       ; Counter, number of repeat.

LOOP:
        NOP
        DCR A
        JNZ LOOP

END:
        JMP END        ; jump to start

; ====

; Jump to DEST if accumulator value great or equals VALUE

CPI VALUE
JNC DEST

; Jump to DEST if *ADDR1 < *ADDR2 or *ADDR2 >= *ADDR1

LDA ADDR1
LXI H, ADDR2
CMP M
JC  DEST

; Overflow?
XRI VALUE
JP  NOOVF


; Inner loops

	MVI B, 10
	MVI C, 5

LOOP:
	NOP 		; Logic

	DCR C
	JNZ LOOP

	MVI C, 5
	DCR B
	JNZ LOOP

END:
	JMP END

; 16-bit counter

	LXI 	B, 0102H

LOOP:
	DCX	B
	MOV  A, B
	ORA 	A
	JNZ LOOP

; Arrays

