<template>
    <main class="view">
        <img alt="cpu" src="cpu.png">

        <pre v-text="text">

        </pre>

        <router-link class="btn m entry" tag="button" to="/assembler">Try!</router-link>

        <p>
            Intel 8080 in 2k19, lol wtf? See <router-link tag="a" to="/about">about</router-link>.
            More cool examples can be found <router-link tag="a" to="/examples">here</router-link>.
        </p>
    </main>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"
    import {intro} from "@/examples/intro"

    @Component
    export default class Home extends Vue {
        text: string = intro.text
    }
</script>

<style scoped>
    main {
        width: 66%;
        font-size: 1em;
    }

    pre {
        border: 1px solid #dfdfdf;
        text-align: left;
        width: 100%;
        font-family: "Share Tech Mono", monospace;
        resize: none;
        padding: 1em;
        border-radius: 3px;
        background-color: #fafafa;
        margin: 1em 0;
        color: #606060;
    }

    button {
        padding: .5em 1em;
        margin-bottom: 1em;
    }
</style>
