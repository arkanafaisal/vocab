function response(res, success, message, data = null, code = null){
    const payload = {
        success: success,
        message: message,
    }
    if(data){payload.data = data}
    return res.status(code || 200).json(payload)
}
export { response };