let isServerAwake = false
let loading = false
checkServerState()
setInterval(()=>{
    if(!loading){
        loading = true
        checkServerState()
    }
}, 5000)

const developmentUrl = "http://localhost:3000/"
const productionUrl = "https://vocab-server.glitch.me/"
const url = productionUrl
async function startFetching(endpoint, method, token, body) {
    if(!isServerAwake){
        return {success: false, message: "server masih tidur", data: null}
    }
    try {
        let options = {
            method: method,
            credentials:"include",
            headers: {
                'Content-type': 'application/json'
            }
        }
        if(token){options.headers.Authorization = "Bearer " + token}
        if(body){options.body = JSON.stringify(body)}

        const response = await fetch(url + endpoint, options)

        
        const result = await response.json()
        return result
    } catch(error) {
        if(error.name === "TypeError"){return {success: false, message: "server mati, hubungi admin", data: null}}
        return {success: false, message: "error, harap hubungi admin", data: null}
    }
}
    
async function checkServerState() {
    if(isServerAwake){return}
    try{
        const response = await fetch(url + "check")
        isServerAwake = true
        console.log("the server is awake")
        loading = false
    } catch(error) {
        isServerAwake = false
        console.log("the server is asleep")
        loading = false
    }
}
