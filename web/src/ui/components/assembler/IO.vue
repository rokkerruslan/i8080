<template>
    <div>
        <div class="video"></div>

        <ul>
            <li :v-key="line" v-for="line of alphabet">
                <button :v-key="symbol" class="btn" v-for="symbol of line">{{ symbol.toUpperCase() }}</button>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    @Component
    export default class IO extends Vue {
        alphabet = ["qwertyuiop", "asdfghjkl", "zxcvbnm!", ",.+-*/%"]
    }
</script>

<style scoped>
    ul {
        list-style: none;
        margin-top: 1em;
    }

    button {
        width: 2em;
        height: 2em;
        padding: 0;
        border-radius: 50%;
        margin-right: 0.4em;
    }

    .video {
        min-width: 400px;
        min-height: 300px;
        background-color: #333333;
        border-radius: 3px;
    }
</style>
