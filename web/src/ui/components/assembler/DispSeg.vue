<template>
  <svg :width="40" viewBox="0 0 100 170">
    <path data-pin="g" d="m 19,76 -8,9 8,9 h 61 l 9,-9 -9,-9 z"/>
    <path data-pin="f" d="M 0,6 V 72 L 7,78 18,68 V 24 Z"/>
    <path data-pin="e" d="M 0,165 V 94 L 7,88 18,98 v 48 z"/>
    <path data-pin="d" d="M 3,170 20,152 h 58 l 18,18 z"/>
    <path data-pin="c" d="M 100,165 V 94 L 93,88 82,98 v 48 z"/>
    <path data-pin="b" d="M 100,6 V 72 L 93,78 82,68 V 24 Z"/>
    <path data-pin="a" d="M 3,0 20,18 H 78 L 96,0 Z"/>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Segment extends Vue {
  @Prop()
  public value!: number;
  
  //   a
  // f   b
  //   g
  // e   c
  //   d


  show() {
    const chars= {
      // gfedcba
      0:   "0000000",// clearing
      63:  "0111111",// 0
      6:   "0000110",// 1
      91:  "1011011",// 2
      79:  "1001111",// 3
      102: "1100110",// 4
      109: "1101101",// 5
      125: "1111101",// 6
      7:   "0000111",// 7
      127: "1111111",// 8
      111: "1101111", // 9
      119: "1110111", // A
      93:  "1111100", // B
      57:  "0111001", // C
      94:  "1011110", // D
      121: "1111001", // E
      113: "1110001" // F
    }
    type CharValues = typeof chars[keyof typeof chars];

    const charsIndex = { ...chars } as { [key: number]: CharValues };

    const code = charsIndex[this.value as keyof typeof charsIndex];
    const svg = this.$el as SVGElement;
    const paths = svg.querySelectorAll('path');
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i] as SVGPathElement;
      if(code[i] ==="1"){
        path.classList.add("light");
      }else{
        path.classList.remove("light");
      }
      
    }
  }
    
}
</script>

<style scoped>
  svg { margin: 5px; }
  path { fill: #b2bcab; }
  path.light { fill: #383b37; }
</style>