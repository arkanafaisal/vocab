function response(res, success, message, data = null, error = null){
    const payload = {
        success: success,
        message: message,
    }
    if(data){payload.data = data}
    if(error){payload.error = error}
    return res.json(payload)
}
export { response };