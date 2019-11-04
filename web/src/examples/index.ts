
export {introduction, tutorial, example}

interface example {
    text: string
    name: string
    description: string
}

// introduction example (at first assembler page loading)
let introduction = `
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

// Simple source code for assembler introduction
// runs purpose's. Uses when no internet.
let tutorial: string = `
        ; Program example for parser

        ; Hexadecimal data. Each hexadecimal number must be followed
        ; by a letter 'H' or 'h' and must begin with a numeric digit (0-9)
        MVI     C, 0BAH         ; Load register C with the
                                ; hexadecimal number BA

        ; Decimal data. Each decimal number may optionally by lollowed by
        ; the letter 'D' or 'd', or may stand alone.
        MVI     C, 105          ; Load register C with 105

        ; Octal data. Each octal number must be followed by one of the
        ; letter 'O', 'o', 'Q', 'q'.
        MVI     C, 72O          ; Load register C with octal number 72
        MVI     C, 12q          ; Load register C with octal number 12

        ; Binary data. Each binary number must by followed by the letter 'B' 'b'
        MVI     10B, 11110110b  ; Load register two
                                ; (the D register) with 0f6h

        JMP     0010111011111010B   ; Jump to memory address 2efa

        ; The current program counter. This is specified as the
        ; character '$' and is equal to the address of the current
        ; instruction
        LDA     $

        ; An ASCII constant. This is one or more ASCII character enclosed
        ; in sindle quotes
        MVI     E, '*'  ; Load the E register with the
                        ; eight-bit ASCII representation of an asterisk

A1:     MVI     D, 1
A2:     MVI     2, 2    ; Load register D with 2

        ; A register pair to serve as the source r destination
        ; in a data operation. Register pairs are specified as follows
        ;       B       Register B and C
        ;       D       Register D and E
        ;       H       Register H and L
        ;       PSW     One byte indicating the state of the confition bits
        ;               and register A
        ;       SP      The 16-bit stack pointer register

        PUSH    D
        PUSH    PSW

        MVI     H, data     ; Load the H register with the value
                            ; if data

        ; PSEUDO INSTRUCTIONS

        ; Data instructions

                                    ; Assembled Data (hex)
        DB      0a3h                ; a3
string:
        DB      'Hello, World!'     ; ...
        DB      03h                 ; fd

        ; Assume COMP address memory location 3b1ch and FILL
        ; addresses memory location 2eb4h
        DW      COMP            ; 1c3b
        DW      FILL            ; b42e
        DW      3c01h, 2caeh    ; 013cae2c

        DS      10              ; Reserve the next 10 bytes
        DS      10h             ; Reverve the next 16 bytes


        ; Org instruction's

        ORG 100h

        MOV A, C    ; address = 100
        MOV B, C    ; address = 101

HERE:   ORG 105H

        NOP         ; address = 105

        ; EQU
PTO:    EQU     8

        OUT     PTO

        ; SET

IMMED:  SET     5
        ADI     IMMED   ; c605

IMMED:  SET     10
        ADI     IMMED   ; c60a

        ; IF
        ; ENDIF
        ; The assemler evaluates exp. If exp exaluates to zero, the statement
        ; between IF and ENDIF are ignored. Otherwise the invernin statements are
        ; assembled as if the IF and ENDIF were not present

                          ; Assembled Data
  COND:   set     0ffh
          IF      COND
          mov     a, c    ; 79
          ENDIF
  COND2:  set     0
          if      cond2
          mov     a, c
          endif
          xra c           ; a9

          ; MACRO
          ; ENDM

  shrt:   macro
          rrc
          ani 7fh
          endm

          ; We can now reference the macro by placing the following
          ; instructions later in the same program
          lda     temp
          shrt

          ; which would be equivalent to writing:
          lda     temp
          rrc
          ani 7fh

  shv:    macro
  loop:   rrc
          ani 7fh
          dcr d
          jnz loop
          endm

          ; The SHV marco may then be referenced as follows:
          lda temp
          mvi d, 3
          shv
          sta temp

          ; The above instruction sequence is equivalent to the expression:
  ;       lda temp
  ;       mvi d, 3
  ; loop: rrc
  ;       ani 7fh
  ;       dcr d
  ;       jnz loop
  ;       sta temp

          ; Note that the D register contents will change when-ever the shv marco is referenced,
          since it is used to specify shift count.

          shv2 macro reg, amt
          mvi reg, amt
  loop:   rrc
          ani 7fh
          dcr reg
          jnz loop
          endm

          ; shv2 may now be referenced as follows:
          lda temp
          shv2 c, 5

          ; The expansion of which is given by:
  ;       mvi c, 5
  ; loop: rrc
  ;       ani 7fh
  ;       dcr c
  ;       jnz loop


          ; Marcro references
  load    macro addr
          mvi   c, addr shr 8
          mvi   b, addr and 0ffh
          endm

  label:  nop
  inst:   nop

          ; The reference:
          load label
          ; is equivalent to the expansion:
          mvi , label shr 8
          mvi 8, label and 0ffh
          ; The reference:
          load inst
          ; is equivalent to the expansion:
          mvi c, inst shr 8
          mvi b, inst and 0ffh

          ; Equate names are always local
  eqmac:  macro
  val:    equ 8
          db  val
          endm

          ; The follosing program section is valid:

                        ; Assemdled Data
  val:    equ 6
  db1:    db  val       ; 06
          eqmac         ; 08
  db2:    db val        ; 06


          ; Consider the macro definition:
  stmac:  macro
  sym:    set   5
          db sym
          endm

                        ; Assembled Data
  sym:    set 0
  db1:    db sym        ; 00
          stmac         ; 05
  db2:    db sym        ; 05

  mac4:   macro p1
  abc:    set 14
          db p1
          endm

  abc:    set 3
          mac3 abc      ; 03

`
