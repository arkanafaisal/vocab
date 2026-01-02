function response(res, success, message, data = null, code = null){
    const payload = {
        success: success,
        message: message,
    }
    if(data){payload.data = data}
    if(code){payload.code = code}
    return res.json(payload)
}
export { response };