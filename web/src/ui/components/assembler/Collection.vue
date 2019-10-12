<template>
    <div class="collection">
        <input @input="changeCriteria"
               class="input"
               placeholder="Search in your collections"
               type="text"
               v-model="criteria">

        <ul>
            <li v-for="p in programs">
                <p class="author" title="Author" v-text="p.Author"></p>

                <p class="description" v-text="p.Description"></p>

                <p title="Lines of Code">LOC: {{ p.Loc }}</p>

                <button class="btn" title="Run the program on emulator">Run</button>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from "vue-property-decorator"

    @Component
    export default class Collection extends Vue {

        // =======================
        // === Props =============
        // =======================

        @Prop()
        programs!: Array<number>

        // =======================
        // === Data ==============
        // =======================

        criteria: string = ""

        // =======================
        // === Methods ===========
        // =======================

        changeCriteria() {
            this.$emit("change-criteria", this.criteria)
        }
    }
</script>

<style scoped>
    .collection {
        width: 100%;
    }

    input {
        padding: .5em 20px;
        width: 66%;
        font-size: 1.2em;
        margin-right: 1em;
    }

    ul {
        list-style-type: none;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
    }

    li {
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

    li p {
        flex: 1;
    }

    li:first-child {
        margin-left: 0;
    }

    li:hover {
        box-shadow: 0 0 8px #464646;
    }

    .author {
        text-shadow: -3px 0 3px #dadada, 3px 0 3px #dadada, 6px 0 6px #dadada, -6px 0 6px #dadada;
    }

    .description {
        margin-bottom: 1em;
    }
</style>
