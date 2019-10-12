import {Dict, Stack} from "./collections"

describe("Stack", () => {
    test("new stack must be empty", () => {
        expect(new Stack().isEmpty()).toBeTruthy()
    })

    test("after push stack should have a size", () => {
        let stack = new Stack()

        stack.push(0)

        expect(stack.isEmpty()).toBeFalsy()
    })

    test("pop from empty stack must fail", () => {
        let s = new Stack()

        expect(() => s.pop()).toThrowError(/pop/)
    })

    test("get last element from empty stack must fail", () => {
        let s = new Stack()

        expect(() => s.last()).toThrowError(/last/)
    })

    test("get last element", () => {
        let s = new Stack()

        s.push(1)

        expect(s.last()).toBe(1)
    })

    test("length after push", () => {
        let s = new Stack()

        s.push(1)

        expect(s).toHaveLength(1)
    })

    test("push-pop cycle", () => {
        let s = new Stack()

        s.push(1)

        expect(s.pop()).toBe(1)
    })

    test("deep push-pop cycle", () => {
        let s = new Stack()

        s.push(1)
        s.push(2)
        s.push(3)

        expect(s.pop()).toBe(3)
        expect(s.pop()).toBe(2)
        expect(s.pop()).toBe(1)
    })

    test("with initial value", () => {
        let s = new Stack([1, 2])

        expect(s.pop()).toBe(2)
        expect(s.pop()).toBe(1)
    })
})

describe("Dict", () => {
    test("new dict must be empty", () => {
        let d = new Dict()

        expect(d.entries()).toMatchObject({})
    })

    test("new dict with initial values", () => {
        let d = new Dict([["a", 1], ["b", 2]])

        expect([...d.entries()]).toMatchObject([["a", 1], ["b", 2]])
    })

    test("set operation", () => {
        let d = new Dict()

        d.set("a", 1)

        expect([...d.entries()]).toMatchObject([["a", 1]])
    })

    test("set operation for non-empty dict", () => {
        let d = new Dict([["a", 1]])

        d.set("b", 2)

        expect([...d.entries()]).toMatchObject([["a", 1], ["b", 2]])
    })

    test("get operation", () => {
        let d = new Dict([["a", 1]])

        expect(d.get("a")).toBe(1)
    })

    test("has operation", () => {
        let d = new Dict([["a", 1]])

        expect(d.has("a")).toBeTruthy()
        expect(d.has("b")).toBeFalsy()
    })

    test("keys operation", () => {
        let d = new Dict([["a", 1], ["b", 2]])

        expect([...d.keys()]).toEqual(["a", "b"])
    })

    test("get value of existed key with alt", () => {
        let d = new Dict([["a", 1]])

        expect(d.get("a", 2)).toBe(1)
    })

    test("get value of missed key with alt", () => {
        let d = new Dict()

        expect(d.get("a", 1)).toBe(1)
    })

    test("get value of missed key without alt", () => {
        let d = new Dict()

        expect(() => d.get("a")).toThrowError(/not exists/)
    })
})
