<template>
    <label :data-tooltip-text="errText" :class="{ tooltip : err, active: active }" :title="title">
        <span v-if="label" v-text="label"></span>

        <input :readonly="readonly"
               :value="formatted"
               :class="{ zero: zero && value === 0, active: active }"
               @keypress.enter="enter"
               @blur="blur"
               @mousedown="md"
               spellcheck="false"
               type="text">
    </label>
</template>

<script lang="ts">
    // FmtInput Component
    //
    // Usage:
    //    Parent component construct <input> component and pass props to it.
    //
    //    template = `
    //       <fmt-input :bits="16" :format="Format.Hex" v-model="emu.pc"></register>
    //    `

    import {Component, Prop, Vue} from "vue-property-decorator"
    import {ifmt, iscan} from "@/libs/strings"

    @Component
    export default class FmtInput extends Vue {
        @Prop()
        public value!: number

        @Prop()
        public readonly!: boolean

        @Prop()
        public bits!: number

        @Prop()
        public format!: number

        @Prop()
        public title!: string

        @Prop()
        public label!: string

        @Prop()
        ascii!: boolean

        @Prop()
        zero!: boolean

        @Prop()
        active!: boolean

        private err = false

        private text = ""

        errText = ""

        md(event: Event) {
            if (this.readonly) event.preventDefault()
        }

        get formatted() {
            return this.err ? this.text : ifmt(this.value, this.format)
        }

        enter(e: any) {
            this.blur(e)
        }

        // Drop focus from input
        blur(event: Event) {
            let val = (event.target as HTMLInputElement).value

            try {
                this.err = false

                if (val == "") {
                    throw new TypeError("value is empty")
                }

                const v = iscan(val, this.ascii)

                if (v >= Math.pow(2, this.bits)) {
                    this.err = true
                    this.text = val
                    this.errText = `${v} number is too big for ${this.bits}-bit register`
                    this.$emit("error", {register: this.label, error: this.err})
                    return
                }

                this.$emit("input", v)
                this.$emit("error", {register: this.label, error: this.err})

            } catch (error) {
                this.err = true
                this.text = val
                this.errText = error.message
                this.$emit("error", {register: this.label, error: this.err})
            }
        }
    }
</script>

<style scoped>
    label {
        background: #555555;
        box-shadow: 0 0 3px #464646;
        padding: .5em;
        border-radius: 0.25em;
        text-shadow: 0 0 1px white;
        width: 100%;
        display: flex;
        font-size: 1em;
    }

    span {
        font-size: inherit;
        color: white;
        margin-right: .5em;
    }

    input {
        text-shadow: inherit;
        color: #f5f5f5;
        font-size: inherit;
        width: 100%;
    }

    /* Tooltips */

    .tooltip {
        background-color: rgb(236, 2, 0);
        box-shadow: 0 0 3px rgb(176, 2, 0);
    }

    .tooltip:hover {
        position: relative;
    }

    .tooltip:hover:after {
        background-color: #ff7e00;
        box-shadow: 0 0 2px 1px #d07523;
        border-radius: 4px;

        color: white;
        font-size: 1em;
        content: attr(data-tooltip-text);

        bottom: 2.5em;
        left: 0;
        padding: .5em;
        position: absolute;
        max-width: 500px;
    }

    .zero {
        color: #d6d6d6;
    }

    .zero:hover {
        color: white
    }

    label.active {
        background-color: #ffd50a;
    }
    input.active {
        color: #ffffff;
    }
</style>
