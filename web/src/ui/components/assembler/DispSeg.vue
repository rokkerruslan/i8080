<template>
    <svg width="40" viewBox="0 0 100 170">
                <path data-pin="a" d="M 3,0 20,18 H 78 L 96,0 Z"/>
                <path data-pin="b" d="M 100,6 V 72 L 93,78 82,68 V 24 Z"/>
                <path data-pin="c" d="M 100,165 V 94 L 93,88 82,98 v 48 z"/>
                <path data-pin="d" d="M 3,170 20,152 h 58 l 18,18 z"/>
                <path data-pin="e" d="M 0,165 V 94 L 7,88 18,98 v 48 z"/>
                <path data-pin="f" d="M 0,6 V 72 L 7,78 18,68 V 24 Z"/>
                <path data-pin="g" d="m 19,76 -8,9 8,9 h 61 l 9,-9 -9,-9 z"/>
    </svg>
</template>
<script type="tsx">
    import {Component,Prop, Vue} from "vue-property-decorator"

  
    export default class Segment extends Vue {        
    }

</script>


<style scoped>
   svg { margin: 5px; }
    path { fill: #b2bcab; }
    path.light { fill: #383b37; }
</style>
