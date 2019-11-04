
export {fix}

// There is special case for evaluating
// register values in `rp` context. For
// this case we must calculate value on
// other table. But there is more clear
// solution. If we look at values which
// must be evaluated we can see, if we
// just shift value by 1, we got right
// number.
//
// LXI (and etc.) instruction
//  00 - B
//  01 - D
//  10 - H
//  11 - SP (SP in LXI and etc context)
//
// But MVI (and etc) instruction
//  000 - B
//  010 - D
//  100 - H
//  111 - A (A in MVI, etc context)
//
let fix = (v: number): number => {
    return v >> 1
}
