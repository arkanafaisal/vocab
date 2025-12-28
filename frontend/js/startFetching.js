const developmentUrl = "http://127.0.0.1:3000/"
const productionUrl = "https://vocab-server.arkanafaisal.my.id/"
const url = productionUrl

async function startFetching(endpoint, method, body = null) {
    try {
        let options = {
            method: method,
            credentials:"include",
            headers: {
                'Content-type': 'application/json'
            }
        }
        if(body){options.body = JSON.stringify(body)}

        const response = await fetch(url + endpoint, options)

        
        const result = await response.json()
        return result
    } catch(error) {
        alert(error)
    }
}
    

