<template>
    <main>
        <div class="search">
            <input class="input"
                   placeholder="Example source code of the I8080 programs" type="text"
                   v-model="query">
        </div>

        <transition-group name="flip-list" tag="ul">
            <li v-for="p in filterProgram" :key="p.description">
                <h2>{{ p.name }}</h2>

                <p class="description">{{ p.description }}</p>

                <button @click="run(p.text)" class="btn" title="Run the program on emulator">Run</button>
            </li>
        </transition-group>
    </main>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"
    import {example} from "@/examples"
    import {intro} from "@/examples/intro"
    import {memset} from "@/examples/memset"
    import {memcopy} from "@/examples/memcopy"

    @Component
    export default class ExamplesView extends Vue {
        programs: Array<example> = [
            intro,
            memset,
            memcopy,
        ]

        query: string = ""

        run(text: string) {
            localStorage.setItem("source", text)

            this.$router.push({name: "assembler"})
        }

        get filterProgram(): Array<example> {
            if (this.query === "") return this.programs

            const query = this.query.toLowerCase()
            return this.programs.filter((e: example) => {
                return (e.text + e.description).toLowerCase().indexOf(query) != -1
            })
        }
    }
</script>

<style scoped>
    main {
        width: 100%;
    }

    input {
        padding: 1em 20px;
        width: 66%;
        margin-right: 1em;
    }

    ::placeholder {
        color: #aaaaaa;
    }

    .search {
        height: 2em;
        font-size: 1.2em;
        display: flex;
        justify-content: center;
        margin-bottom: .5em;
    }

    ul {
        list-style-type: none;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
    }

    ul > li {
        background-color: white;
        width: 150px;
        height: 200px;
        padding: 0.5em;

        border: 3px solid #f5f5f5;
        border-radius: 4px;
        box-shadow: 0 0 4px #464646;

        margin-left: 1em;
        margin-top: 1em;

        display: flex;
        flex-direction: column;
    }

    ul > li > p {
        flex: 1;
    }

    ul > li:first-child {
        margin-left: 0;
    }

    ul > li:hover {
        box-shadow: 0 0 8px #464646;
    }

    .description {
        margin-bottom: 1em;
    }

    h2 {
        margin-bottom: .5em;
    }
</style>
