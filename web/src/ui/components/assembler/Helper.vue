<template>
    <div>
        <header>
            <button @click="tokenize" class="btn">Lexer</button>
            <button @click="buildAST" class="btn">Parser</button>
            <button @click="saveFile" class="btn">Save Binary File</button>
        </header>

        <hr>

        <pre v-text="tokens"></pre>
    </div>
</template>

<script lang="ts">
    import {Prop, Vue, Component} from "vue-property-decorator"

    import {Rules, scan} from "@/assembler/scanner"
    import {ast} from "@/assembler/syntax"
    import {saveByteArray} from "@/libs/savefile"
    import {assemble} from "@/assembler"

    @Component
    export default class Helper extends Vue {

        @Prop()
        text!: string

        tokens = ""

        tokenize() {
            let tokens = ""
            for (const t of scan(this.text, Rules)) {
                tokens += JSON.stringify(t, null, 2)
            }

            this.tokens = tokens
        }

        buildAST() {
            this.tokens = ""

            for (const node of ast(scan(this.text, Rules))) {
                this.tokens += JSON.stringify(node, null, 2)
            }
        }

        saveFile() {
            saveByteArray(new Int8Array(assemble(this.text).text), "example.bin")
        }
    }
</script>

<style scoped>
    div {
        display: flex;
        flex-direction: column;
    }
    button {
        margin-right: 1em;
    }

    hr {
        margin: 1em 0;
    }

    pre {
        font-size: 1em;
        font-family: "Share Tech Mono", monospace;
        text-align: left;
        background-color: whitesmoke;
        padding: 1em;
        border: 1px solid #e7e7e7;
        border-radius: 3px;

        height: 75vh;
        overflow: auto;
    }
</style>
