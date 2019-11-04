<template>
    <div>
        Docs

        <hr>

        Read the <a href="https://altairclone.com/downloads/manuals/8080%20Programmers%20Manual.pdf">Intel 8080 Programming Manual</a>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    @Component
    export default class Docs extends Vue {
    }
</script>

<style scoped>
    ul {
        list-style: none;
        margin-top: 1em;
    }

    hr {
        margin: 1em 0;
    }
</style>
