<template>
    <div class="editor">
        <div class="tabs">
            <span>File: main.asm</span>
            <button @click="saveSourceFile" class="btn" style="margin-left: 1em">Save</button>
        </div>

        <div class="monaco" id="editor"></div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue, Watch} from "vue-property-decorator"
    import {editor, Range, languages} from "monaco-editor"

    languages.register({ id: "asm" })

    languages.setMonarchTokensProvider("asm", {
        tokenizer: {
            root: [
                [/;.*/, "comment"],
                [/[a-zA-Z][0-9a-zA-Z]*:/, "label"],
            ]
        }
    })

    const setupEditor = (tag: string, text: string): editor.IStandaloneCodeEditor => {
        const el = document.querySelector("#editor")

        if (el === null) throw new TypeError("editor unavailable")

        editor.defineTheme("asm-theme", {
            base: "vs",
            inherit: true,
            rules: [
                {token: "text", foreground: "111111"},
                {token: "label", foreground: "006296", fontStyle: "bold"},
                {token: "comment", foreground: "888888"},
            ],
            colors: {},
        })

        const e = editor.create(el as HTMLElement, {
            theme: "asm-theme",
            language: "asm",
            value: text,
            fontSize: 18,
            glyphMargin: true,
            lineNumbers: "off",
            fontFamily: "Share Tech Mono, monospace",
            selectionHighlight: false,
            occurrencesHighlight: false,
            smoothScrolling: true,
            codeLens: false,
            contextmenu: false,
            folding: false,
            disableLayerHinting: true,
            highlightActiveIndentGuide: false,
            minimap: {
                enabled: false,
            },
            renderLineHighlight: "none",
        })

        e.getModel()!.updateOptions({tabSize: 8})

        return e
    }

    @Component
    export default class Editor extends Vue {

        // ==== Props ======================================== //

        @Prop()
        text!: string

        @Prop()
        currentLine!: number | null

        @Prop()
        breakpoints!: Array<number>

        @Prop()
        errors!: Array<any>

        // ==== Data ========================================= //

        e!: editor.IStandaloneCodeEditor

        debugActiveLinesDecoration: Array<string> = []
        debugLinesDecoration: Array<string> = []
        debugLinesHoverDecoration: Array<string> = []
        errorsDecoration: Array<string> = []

        // ==== Hooks ======================================== //

        // noinspection JSUnusedGlobalSymbols
        mounted() {
            const val = this.text

            const e = setupEditor("#editor", val)

            e.onMouseMove(i => {
                if (i.target.type !== editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                    this.debugLinesHoverDecoration = e.deltaDecorations(this.debugLinesHoverDecoration, [])
                    return
                }

                this.debugLinesHoverDecoration = e.deltaDecorations(this.debugLinesHoverDecoration, [
                    {
                        range: new Range(i.target.position!.lineNumber, 1, i.target.position!.lineNumber, 1),
                        options: {
                            glyphMarginClassName: "potentialBreakpoint"
                        }
                    }
                ])
            })

            e.onMouseDown(event => {
                if (event.target.type !== editor.MouseTargetType.GUTTER_GLYPH_MARGIN) return

                this.$emit("toggle-breakpoint", event.target.position!.lineNumber - 1)

                // Clear all
                this.debugActiveLinesDecoration = e.deltaDecorations(this.debugActiveLinesDecoration, [])

                // Set new
                let l: Array<editor.IModelDeltaDecoration> = []

                this.breakpoints.forEach(i => {
                    l.push({
                        range: new Range(i + 1, 1, i + 1, 1),
                        options: {
                            glyphMarginClassName: "activeBreakpoint"
                        }
                    })
                })

                this.debugActiveLinesDecoration = e.deltaDecorations([], l)
            })

            e.onDidChangeModelContent(() => this.$emit("change-text", e.getValue()))

            this.e = e
        }

        destroy() {
            this.e.dispose()
        }

        // ==== Watchers ===================================== //

        @Watch("errors")
        wErrors(a: Array<any>) {
            this.errorsDecoration = this.e.deltaDecorations(this.errorsDecoration, [])

            for (const i of a) {
                this.errorsDecoration = this.e.deltaDecorations(this.errorsDecoration, [
                    {
                        range: new Range(i.line + 1, i.start + 1, i.line + 1, i.end + 1),
                        options: {
                            className: "error",
                            hoverMessage: {value: i.text}
                        }
                    }
                ])
            }
        }

        @Watch("currentLine")
        wCurrentLine(n: number | null) {

            // We can't edit source code if emulation is processed
            this.e.updateOptions({readOnly: n !== null})

            if (n === null) {
                this.e.deltaDecorations(this.debugLinesDecoration, [])
                return
            }
            n += 1

            this.debugLinesDecoration = this.e.deltaDecorations(this.debugLinesDecoration, [
                {
                    range: new Range(n, 1, n, 44),
                    options: {
                        className: "debugCurrentLine",
                        isWholeLine: true,
                    }
                },
            ])
        }

        // ==== Methods ====================================== //

        saveSourceFile() {
            localStorage.setItem("source", this.text)
        }
    }
</script>

<style scoped>
    .editor {
        height: 100%;
    }

    .monaco {
        height: calc(100% - 34px);
        text-align: left;
    }

    .tabs {
        padding-bottom: .5em;
        margin-top: -.5em;
        border-bottom: 1px solid #dfdfdf;
    }

    .tabs button {
        font-size: 1em;
    }
</style>
