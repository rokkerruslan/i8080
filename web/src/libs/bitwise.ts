// bitwise - helpers for bits manipulating

// Construct 8-bit number from host-bit number.
const to8 = (n: number): number => n & 0xff

const low = to8

const high = (n: number): number => (n >> 8) & 0xff

// Construct 16-bit number from two bytes, represents high and low bit
//	of target number.
const to16 = (h: number, l: number): number => (low(h) << 8) | low(l)

// Divide one 16-bit number on two byte represents high and low bit
// of source number.
const from16 = (n: number): [number, number] => [high(n), low(n)]

// Bit's arithmetic.
const setclrb = (word: number, index: number, condition: boolean | number) => {
    return condition ? setb(word, index) : clrb(word, index)
}

const setb = (word: number, index: number) => to8(word | (1 << index))

const clrb = (word: number, index: number) => word & to8(~(1 << index))

const xorb = (word: number, index: number) => to8(word ^ (1 << index))

export {low, high, to16, to8, from16, setb, clrb, xorb, setclrb}
