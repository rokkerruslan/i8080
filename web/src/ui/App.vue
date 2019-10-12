<template>
    <div class="app">
        <header>
            <div class="info"><a href="https://github.com/rokkerruslan/i8080">src:github/i8080</a></div>

            <div class="links">
                <router-link v-for="link of links"
                             :key="link.to"
                             :to="link.to"
                             v-text="link.name"
                             class="btn"
                             tag="button"></router-link>
            </div>

            <div class="versions">
                <p>server: {{ version }}</p>
                <p>client: {{ clientVersion }}</p>
            </div>
        </header>

        <section>
            <router-view/>
        </section>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    interface info {
        Version: string
    }

    @Component
    export default class App extends Vue {
        clientVersion = process.env.VUE_APP_CLIENT_VERSION

        links = [
            {to: "/", name: "Home"},
            {to: "/assembler", name: "Assembler"},
            {to: "/collections", name: "Collections"},
            {to: "/about", name: "About"},
            {to: "/examples", name: "Examples"},
        ]

        version: string = "offline"

        mounted() {
            fetch(process.env.VUE_APP_API_INFO, {mode: "no-cors"}).then(r => r.json()).then(info => {
                console.log("Connect to server:", info)
                this.version = info.Version
            }).catch(err => {
                console.log("server not available", err)
                return "offline"
            })
        }
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
        justify-content: space-between;

        background-color: white;
        border-bottom: 1px solid #e1e1e1;
        padding: .5em 1em;
    }

    .info a {
        color: #a6a6a6;
        text-shadow: 0 0 1px #e5e5e5;
        font-family: "Share Tech Mono", monospace;
        text-decoration: none;
    }

    .links {
        display: flex;
    }

    .versions {
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-family: "Share Tech Mono", monospace;
        color: #b9b9b9;
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
