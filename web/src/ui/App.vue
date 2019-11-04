<template>
    <div class="app">
        <header>
            <router-link v-for="link of links"
                         :key="link.to"
                         :to="link.to"
                         v-text="link.name"
                         class="btn"
                         tag="button"></router-link>
        </header>

        <section>
            <router-view/>
        </section>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    @Component
    export default class App extends Vue {
        links = [
            {to: "/", name: "Home"},
            {to: "/assembler", name: "Assembler"},
            {to: "/collections", name: "Collections"},
            {to: "/about", name: "About"},
            {to: "/examples", name: "Examples"},
        ]
    }
</script>

<style>
    @import "styles/main.css";
</style>

<style scoped>
    .app {
        text-align: center;
        color: #2c3e50;
        height: 100%;
        width: 100%;

        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 5em auto;
        grid-template-areas: "Header" "Editor";

        background-image: url("assets/cats.webp");
    }

    header {
        grid-area: Header;

        display: flex;
        justify-content: center;

        background-color: white;
        border-bottom: 1px solid #e1e1e1;
        padding: .5em 1em;
    }

    button {
        margin-right: .5em;
    }

    section {
        grid-area: Editor;
        margin: 1em;
        display: flex;
    }
</style>
