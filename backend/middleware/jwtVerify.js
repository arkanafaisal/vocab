import jwt from 'jsonwebtoken'

import { response } from '../utils/response.js'

function verifyJwt(req, res, next){
    const token = req.cookies.accessToken

    if(!token){return response(res, false, "token invalid", null, 401)}

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY)
        req.user = decoded
        next()
    } catch(err) {
        if (err.name === 'TokenExpiredError') {
            return response(res, false, "token expired", null, 401)
        } else if (err.name === 'JsonWebTokenError') {
            return response(res, false, "token invalid", null, 401)
        }
        return response(res, false, "server error", null, 500)
    }
}

export default verifyJwt