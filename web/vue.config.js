
module.exports = {
    // vue-cli bug
    productionSourceMap: false,

    outputDir: "../dist",

    // hoverMessage does not working after this configure.
    // configureWebpack: {
    //     resolve: {
    //         alias: {
    //             // reduce bundle size
    //             // https://github.com/Microsoft/monaco-editor-webpack-plugin/issues/11#issuecomment-403446853
    //             "monaco-editor": "monaco-editor/esm/vs/editor/editor.api.js",
    //         },
    //     },
    // },
}
