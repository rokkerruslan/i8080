
export {fetchCollections}

async function fetchCollections(criteria: string, credentials: string) {
    const url = new URL(process.env.VUE_APP_API_COLLECTIONS)

    url.search = (new URLSearchParams({criteria: criteria})).toString()

    const opt = credentials != "" ? {headers: {"x-auth-token": credentials}} : {}

    return await fetch(url.toString(), opt).then(r => {
        return r.json()
    }).catch(err => {
        console.error(err)
    })
}
