function response(statusCode,status, message, data, res){
    res.status(statusCode).json({
        success: status,
        status: statusCode,
        message: message,
        data: data,
    })
    return
}
export { response };