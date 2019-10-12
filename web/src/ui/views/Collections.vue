<template>
    <main class="view wip" v-if="true">
        <p>Availability to create own collections of code in dev</p>
    </main>

    <main class="view" v-else-if="false">
        <p>If you want save your code, please register or login</p>

        <label class="input2">
            <span>&nbsp;&nbsp;&nbsp;Login:</span>
            <input tabindex="1" v-model="login">
        </label>

        <label class="input2">
            <span>Password:</span>
            <input tabindex="2" v-model="password">
        </label>

        <div class="buttons">
            <button @click="signUp" class="btn margin">Sign Up!</button>
            <button @click="signIn" class="btn">Sign In!</button>
        </div>

        <div v-text="errors"></div>
    </main>

    <main class="collections" v-else="false">
        <div>
            <span>Login: {{ this.login }} </span>
            <button @click="signOut" class="btn">Logout</button>
        </div>

        <collection :programs="programs" @change-criteria="changeCriteria"></collection>
    </main>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator"

    import {fetchCollections} from "@/libs/interaction"

    import Collection from "../components/assembler/Collection.vue"

    const authTokenKey = "auth-token"

    interface Credentials {
        Login: string
        Password: string
    }

    interface Token {
        Token: string
    }

    interface Auth {
        Credentials: Credentials
        Token: Token
    }

    @Component({components: {Collection}})
    export default class CollectionsView extends Vue {

        // ==== Data ======================================= //

        login = ""
        password = ""
        isNeedAuth = false
        programs = []

        errors = ""

        // ==== Hooks ====================================== //

        // noinspection JSUnusedGlobalSymbols
        async mounted() {
            console.log("Mounted Collections", localStorage.token)

            const authToken = localStorage.getItem(authTokenKey) || ""

            if (authToken == "") {
                this.isNeedAuth = true
            } else {
                let a = JSON.parse(authToken) as Auth

                this.login = a.Credentials.Login;

                await fetchCollections("", "").then(programs => {
                    this.programs = programs
                })
            }
        }

        // ==== Methods ==================================== //

        signUp() {
            this.auth(process.env.VUE_APP_API_SIGN_UP)
        }

        signIn() {
            this.auth(process.env.VUE_APP_API_SIGN_IN)
        }

        auth(url: string) {
            fetch(url, {
                method: "post",
                body: JSON.stringify({Login: this.login, Password: this.password} as Credentials)

            }).then(async r => {

                if (r.ok) {
                    const token = await r.json() as Token
                    localStorage.setItem(authTokenKey, JSON.stringify({
                        Credentials: {Login: this.login},
                        Token: token
                    } as Auth))
                    this.isNeedAuth = false
                    this.errors = ""

                    await this.changeCriteria("")
                }

                this.errors = await r.json()

            }).catch(err => {
                console.log(err)
                this.errors = err
            })
        }

        signOut() {
            localStorage.removeItem(authTokenKey)
            this.isNeedAuth = true
        }

        async changeCriteria(criteria: string) {
            await fetchCollections(criteria, "").then(r => {
                this.programs = r
            })
        }
    }
</script>

<style scoped>
    .wip {
        font-size: 2em;
        width: 66%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .collections {
        width: 100%;
    }

    .collections div:first-child {
        margin-bottom: 1em;
    }

    .buttons button:first-child {
        margin-right: .5em;
    }

    label {
        margin: 1em auto;
    }

    .input2 {
        width: 50%;
        padding: .5em;
    }

    .btn {
        padding: .5em;
    }
</style>
