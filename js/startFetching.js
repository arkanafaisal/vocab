async function startFetching(endpoint, method, token, body) {
        try {
            let options = {
                method: method,
                credentials:"include",
                headers: {
                    'Content-type': 'application/json'
                }
            }
            if(token){options.headers.token = token}
            if(body){options.body = JSON.stringify(body)}

            const response = await fetch("https://vocab-server.glitch.me/" + endpoint, options)


            const result = await response.json()
            return result
        } catch(error) {
            if(error.name === "TypeError"){return {success: false, message: "server mati, hubungi admin", data: null}}
            return {success: false, message: "error, harap hubungi admin", data: null}
        }
    }
