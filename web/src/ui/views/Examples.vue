<template>
    <main>
        <div class="search">
            <input class="input"
                   placeholder="Example source code of the I8080 programs" type="text"
                   v-model="query"
                   v-on:input="filterProgram">
        </div>

        <transition-group name="flip-list" tag="ul">
            <li v-for="p in programs" :key="p.Name">
                <p class="author" title="Author">{{ p.Author }}</p>

                <p class="description">{{ p.Description }}</p>

                <p title="Lines of Code">LOC: {{ p.Loc }}</p>

                <button @click="run(p.Text)" class="btn" title="Run the program on emulator">Run</button>
            </li>
        </transition-group>
    </main>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    @Component
    export default class ExamplesView extends Vue {
        programs = []

        query: string = ""

        run(text: string) {
            localStorage.setItem("source", text)

            this.$router.push({name: "assembler"})
        }

        filterProgram() {
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

    .author {
        text-shadow: -3px 0 3px #dadada,
        3px 0 3px #dadada,
        6px 0 6px #dadada,
        -6px 0 6px #dadada;
    }

    .description {
        margin-bottom: 1em;
    }
</style>
