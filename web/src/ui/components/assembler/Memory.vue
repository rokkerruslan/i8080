<template>
    <div>
        <p>Memory block, start: <span v-text="start"></span>, bits: <span v-text="format"></span>
            <span> Warning! You can change all part of memory, even loaded binary"</span>
        </p>

        <section class="controls">
            <label class="checkbox" v-for="b of formatButtons">
                <input :value="b.value" type="radio" v-model="format">
                <span v-text="b.text"></span>
            </label>

            <fmt-input label="Address:" class="address" :format="16" v-model="start"></fmt-input>
        </section>

        <section class="memory-unit">
            <fmt-input :key="index"
                       :title="address(index)"
                       v-model="memory[index]"
                       :format="format"
                       :readonly="readonly"
                       :bits="8"
                       :ascii="isAscii"
                       :zero="true"
                       v-for="index in indexes"></fmt-input>
        </section>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from "vue-property-decorator"
    import {Format, ifmt} from "@/libs/strings"
    import {range2} from "@/libs/extra"

    import FmtInput from "./FmtInput.vue"

    const defaultSize = 128

    @Component({components: {FmtInput}})
    export default class Memory extends Vue {
        format: Format = Format.Hex

        @Prop()
        readonly!: boolean

        @Prop()
        public memory!: Array<number>

        formatButtons = [
            {text: "Hex", value: Format.Hex},
            {text: "Dec", value: Format.Dec},
            {text: "Oct", value: Format.Oct},
            {text: "Bin", value: Format.Bin},
            {text: "Ascii", value: Format.Ascii},
        ]

        get indexes() {
            const start = Number(this.start)
            return range2(start, defaultSize)
        }

        start: number = 0

        unit(n: number) {
            return ifmt(n, this.format, 2)
        }

        address(index: number) {
            return ifmt(index, Format.Hex, 4)
        }

        get isAscii() {
            return this.format == Format.Ascii
        }
    }
</script>

<style scoped>
    .controls {
        margin: 1em 0;
        display: flex;
    }

    .controls > label {
        flex-grow: 1;
    }

    .address {
        width: 5%;
        margin-left: 1em;
    }

    .memory-unit {
        display: grid;
        grid-template-columns: auto auto auto auto auto auto auto auto;
    }

    .memory-unit label {
        margin-bottom: .25em;
        margin-right: .25em;
        width: initial;
    }

    .memory-unit label:hover {
        background-color: #ef8f15;
        box-shadow: 0 0 3px rgb(85, 85, 85);
    }
</style>
