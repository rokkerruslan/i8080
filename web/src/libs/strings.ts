// strings - helpers for string manipulating, formatting and scanning.

import {Dict} from "@/libs/collections"

export {Ascii, Format, ifmt, iscan}

// 0 - is special value, other components work
// with number in Format.Ascii like text value
// not a number.
enum Format { Ascii = 0, Bin = 2, Oct = 8, Dec = 10, Hex = 16 }

// Code page 1251
const Ascii = [
    "NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI",
    "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US",
    " ", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?",
    "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
    "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "", "^", "_",
    "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
    "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "DEL",
    "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1",
    "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1",
    "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1",
    "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1",
    "А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П",
    "Р", "С", "Т", "Н", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ы", "Ь", "Э", "Ю", "Я",
    "а", "б", "в", "г", "д", "е", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п",
    "р", "с", "Т", "н", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я",
]

const Postfixes = new Dict([
    [Format.Ascii, ""],
    [Format.Bin, "B"],
    [Format.Oct, "O"],
    [Format.Dec, ""],
    [Format.Hex, "H"],
])

const ScanPostfixes = new Dict([
    ["B", "0b"],
    ["O", "0o"],
    ["H", "0x"],
])

// Convert number to string and formatting for specific numeric
// system and with needed string width.
//
// Examples:
//      >>> ifmt(16)
//      10H
//
//      >>> ifmt(10, Format.Bin)
//      1010B
//
//      >>> ifmt(13, Format.Hex, 4)
//      000DH
//
let ifmt = (n: number, system = Format.Hex, width = 1): string => {
    if (system === Format.Ascii) {
        if (n >= Ascii.length || n < 0) {
            throw TypeError(`can't format "${n}" as ascii`)
        }
        return Ascii[n]
    } else {
        return n.toString(system).padStart(width, "0").toUpperCase() + Postfixes.get(system)
    }
}

let iscan = (s: string, ascii = false): number => {
    if (ascii) {
        const index = Ascii.indexOf(s)

        if (index < 0) {
            throw TypeError("iscan can't decode ${s} as ascii")
        }

        return index
    }

    s = s.trim().toUpperCase()

    if (s.length === 0) throw TypeError("value is empty")

    const postfix = s.slice(-1)

    const base = ScanPostfixes.get(postfix, "")

    let val = 0

    // decimal number
    if (base === "") {
        val = Number(s)

    } else {
        s = s.slice(0, -1)  // drop postfix
        if (s.length === 0) throw TypeError("s contains only prefix")
        val = Number(base + s)
    }

    if (isNaN(val)) throw new Error(`${s} is not a number`)

    return val
}
