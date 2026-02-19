function response(res, success, message, data = null, code = 200){
    const payload = {
        success: success,
        message: message,
    }
    if(data){payload.data = data}
    return res.status(code).json(payload)
}
export { response };