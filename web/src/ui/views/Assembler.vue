<template>
    <main>
        <header>
            <button @click="b.click" v-for="b of subHeader" :key="b.name" v-text="b.name" class="btn"></button>
        </header>

        <div class="panels">
            <section v-show="isEditor">
                <editor :breakpoints="emu.breakpoints"
                        :errors="tmperrors"
                        :current-line="currentLine"
                        :text="this.text"
                        @change-text="t => { this.text = t }"
                        @toggle-breakpoint="(n) => emu.toggleBreakpoint(n)"
                ></editor>
            </section>

            <section v-show="isMemory">
                <memory :memory="emu.memory" :readonly="this.isRunning" :pc="emu.pc"></memory>
            </section>

            <section v-show="isAdditional">
                <helper :text="text"></helper>
            </section>

            <section v-show="isSettings">
                <p>Work in progress</p>
            </section>

            <section v-show="isIO">
                <i-o></i-o>
            </section>

            <section v-show="isDocs">
                <docs></docs>
            </section>

            <section class="control-panel">
                <div class="indicator-block" title="Indicator Block">
                    <div v-for="i of indicatorBlock" :key="i.name">
                        <span v-text="i.name"></span>
                        <div :title="i.title" :class="{'indicator-off': i.class}" class="indicator"></div>
                    </div>
                </div>

                <hr>

                <div class="control-block" title="Emulator Control Block">
                    <button v-for="b of controlBlock"
                            :key="b.name"
                            :title="b.title"
                            :disabled="b.disabled"
                            @click="b.click"
                            class="btn"
                            v-text="b.name"></button>
                </div>

                <hr>

                <div class="register-block" title="Register Block">
                    <fmt-input v-model="emu.pc" @error="handleError" :bits="16" :format="format" :readonly="this.isRunning" label="PC" title="Program Counter"></fmt-input>
                    <fmt-input v-model="emu.sp" @error="handleError" :bits="16" :format="format" :readonly="this.isRunning" label="SP" title="Stack Pointer" ></fmt-input>

                    <div class="block8bit">
                        <fmt-input v-model="emu.b" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="B" title="B Register"></fmt-input>
                        <fmt-input v-model="emu.c" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="C" title="C Register"></fmt-input>
                    </div>

                    <div class="block8bit">
                        <fmt-input v-model="emu.d" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="D" title="D Register"></fmt-input>
                        <fmt-input v-model="emu.e" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="E" title="E Register"></fmt-input>
                    </div>

                    <div class="block8bit">
                        <fmt-input v-model="emu.h" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="H" title="H Register"></fmt-input>
                        <fmt-input v-model="emu.l" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="L" title="L Register"></fmt-input>
                    </div>

                    <div class="block8bit">
                        <fmt-input v-model="emu.a" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="A" title="Accumulator"></fmt-input>
                        <fmt-input v-model="emu.flags" @error="handleError" :bits="8" :format="format" :readonly="this.isRunning" label="F" title="Flag Register"></fmt-input>
                    </div>
                </div>

                <hr>

                <div class="flag-register-block" title="Flag Register Block">
                    <label v-for="flag of flagRegisterBlock" :key="flag.name" :title="flag.title" class="checkbox">
                        <input type="checkbox" v-model="flag.model">
                        <span v-text="flag.name"></span>
                    </label>
                </div>

                <hr>

                <div class="interrupts">
                    <p style="margin-bottom: .5em">INTERRUPTS</p>
                    <button :disabled="isReseted" @click="emu.int(i - 1)" class="btn" v-for="i in 9">{{ i - 1 }}</button>
                </div>

                <hr>

                <div class="other">
                    <fmt-input label="Frequency" :format="10" v-model="frequency"></fmt-input>

                    <fmt-input :readonly="true" :format="10" label="Cycles:" v-model="emu.cycles"></fmt-input>
                </div>
            </section>
        </div>
    </main>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    import {assemble} from "@/assembler"
    import {AssemblerError} from "@/assembler/errors"
    import {Format} from "@/libs/strings"
    import {Emulator, State} from "@/emulator"

    import Memory from "../components/assembler/Memory.vue"
    import FmtInput from "../components/assembler/FmtInput.vue"
    import Editor from "../components/assembler/Editor.vue"
    import IO from "../components/assembler/IO.vue"
    import Helper from "../components/assembler/Helper.vue"
    import Docs from "../components/assembler/Docs.vue"
    import {introduction} from "@/examples";

    enum LeftPanel {
        Editor,
        Memory,
        IO,
        Settings,
        Additional,
        Docs,
    }

    @Component({
        components: {Editor, FmtInput, Memory, IO, Helper, Docs}
    })
    export default class AssemblerView extends Vue {

        // ==== Data ========================================= //

        tmperrors: Array<any> = []

        text = ""

        emu = new Emulator()

        frequency = 1

        errorsOnRegisters = {}

        format = Format.Hex

        leftPanel = LeftPanel.Editor

        // ==== Hooks ======================================== //

        // noinspection JSUnusedGlobalSymbols
        created() {
            const localText = localStorage.getItem("source")

            if (localText == null || localText.length == 0) {
                this.text = introduction
            } else {
                this.text = localText
            }
        }

        // ==== Calculated =================================== //

        // ======== UI ======================================= //

        get isEditor()     { return this.leftPanel == LeftPanel.Editor }
        get isMemory()     { return this.leftPanel == LeftPanel.Memory }
        get isIO()         { return this.leftPanel == LeftPanel.IO }
        get isSettings()   { return this.leftPanel == LeftPanel.Settings }
        get isAdditional() { return this.leftPanel == LeftPanel.Additional }
        get isDocs()       { return this.leftPanel == LeftPanel.Docs }

        get subHeader() {
            return [
                {name: "Editor",       click: () => this.leftPanel = LeftPanel.Editor},
                {name: "Memory",       click: () => this.leftPanel = LeftPanel.Memory},
                {name: "Input/Output", click: () => this.leftPanel = LeftPanel.IO},
                {name: "Settings",     click: () => this.leftPanel = LeftPanel.Settings},
                {name: "Additional",   click: () => this.leftPanel = LeftPanel.Additional},
                {name: "Docs",         click: () => this.leftPanel = LeftPanel.Docs},
            ]
        }

        get indicatorBlock() {
            return [
                {name: "HLT",  title: "Processor has been halted",           class: !this.isHalted},
                {name: "DI",   title: "Interrupts has been disabled",        class:  this.isInterruptEnabled},
                {name: "INT",  title: "Processor has unprocessed interrupt", class: !this.isUnprocessedInterrupts},
                {name: "STOP", title: "Processor has been stopped",          class: !this.isStopped},
            ]
        }

        get controlBlock() {
            return [
                {disabled: !this.isReseted || this.isErrorOnRegister, click: () => this.go(),                         name: "Go",   title: "Assemble, Load and Run"},
                {disabled: !this.isStopped || this.isErrorOnRegister, click: () => this.emu.execute(),                name: "Step", title: "Execute One Instruction"},
                {disabled: !this.isRunning,                           click: () => this.emu.stop(),                   name: "Stop", title: "Stop Execution"},
                {disabled: !this.isStopped || this.isErrorOnRegister, click: () => this.emu.continue(this.frequency), name: "Cont", title: "Continue Execution"},
                {disabled: true,                                      click: () => {},                                name: "Back", title: "Backward Debugger In Dev"},
                {disabled: !this.isStopped && !this.isHalted,         click: () => this.emu.reset(),                  name: "RST",  title: "Reset Emulation"},
            ]
        }

        get flagRegisterBlock() {
            return [
                {model: this.emu.flagS,  name: "S",  title: "sign flag"},
                {model: this.emu.flagZ,  name: "Z",  title: "set if the result is zero"},
                {model: this.emu.flagAC, name: "AC", title: "used for binary-coded decimal arithmetic"},
                {model: this.emu.flagP,  name: "P",  title: "set if the number of 1 bits in the result is even"},
                {model: this.emu.flagCY, name: "CY", title: "carry flag"},
            ]
        }

        get isErrorOnRegister() {
            return Object.values(this.errorsOnRegisters).filter(l => l).length !== 0
        }

        get currentLine() {
            return this.isReseted ? null : this.emu.lines[this.emu.pc]
        }

        // ======== CPU State  ============================= //

        get isInterruptEnabled() {
            return this.emu.isInterruptEnabled
        }

        get isUnprocessedInterrupts() {
            return this.emu.unprocessedInterrupts.length != 0
        }

        get isReseted() {
            return this.emu.state === State.Reseted
        }

        get isRunning() {
            return this.emu.state === State.Running
        }

        get isHalted() {
            return this.emu.state === State.Halted
        }

        get isStopped(): boolean {
            return this.emu.state === State.Stopped
        }

        // ==== Methods ==================================== //

        handleError({register, error}: { register: string, error: boolean }) {
            Vue.set(this.errorsOnRegisters, register, error)
        }

        // todo: handle error from memory

        go() {
            try {
                let of = assemble(this.text)

                this.tmperrors.splice(0, this.tmperrors.length)

                this.emu.load(of)
                this.emu.go(this.frequency)

            } catch (e) {
                console.log(e)

                if (e instanceof AssemblerError) {
                    // this.tmperrors = []
                    this.tmperrors.push(
                        {line: e.line, start: e.start, end: e.end, text: e.message}
                    )
                    return
                }
            }
        }
    }
</script>

<style scoped>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
    }

    main > header button {
        margin-top: -.5em;
        margin-bottom: .5em;
        margin-right: .5em;
    }

    .panels {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
    }

    .panels > section {
        flex-grow: 3;
        padding: 1em;
        margin-left: 1em;
        background-color: white;

        color: #555555;
        border: 1px solid #e1e1e1;
        border-radius: 3px;
        font-size: 1em;
    }

    .panels > section:first-child {
        margin-left: 0;
    }

    /* ==== CONTROL PANEL ================================== */

    .control-panel {
        max-width: 300px;
        min-width: 300px;
    }

    .control-panel .btn {
        margin-bottom: .7em;
        width: 3.5em;
        padding: 0;
    }

    .indicator-block {
        display: flex;
        justify-content: space-around;
        padding-bottom: 1em;
        font-family: 'Share Tech Mono', monospace;
    }

    .indicator-block > div {
        display: flex;
        align-items: center;
    }

    .indicator-block > div span {
        margin-right: .5em;
    }

    .control-block {
        padding-top: 1em;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }

    .register-block {
        padding: 1em 0;
    }

    .register-block > * {
        margin-bottom: .5em;
    }

    .register-block > *:last-child {
        margin-bottom: 0;
    }

    .block8bit {
        display: flex;
    }

    .block8bit > *:first-child {
        margin-right: .5em;
    }

    .flag-register-block {
        display: flex;
        justify-content: space-between;
        padding-bottom: 1em;
        padding-top: 1em;
    }

    .other {
        margin-top: 1em;
    }

    .other label {
        margin-bottom: .5em;
    }

    .interrupts {
        margin-top: .5em;
    }

    .interrupts button {
        margin-right: .5em;
    }
</style>
