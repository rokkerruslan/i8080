import Vue from "vue"
import Router from "vue-router"

import Home            from "./views/Home.vue"
import About           from "./views/About.vue"
import ExamplesView    from "./views/Examples.vue"
import AssemblerView   from "./views/Assembler.vue"
import CollectionsView from "./views/Collections.vue"


Vue.use(Router)

export default new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {
            path: "/",
            name: "home",
            component: Home,
        },
        {
            path: "/assembler",
            name: "assembler",
            component: AssemblerView,
        },
        {
            path: "/collections",
            name: "collections",
            component: CollectionsView,
        },
        {
            path: "/about",
            name: "about",
            component: About,
        },
        {
            path: "/examples",
            name: "examples",
            component: ExamplesView,
        },
    ],
})
