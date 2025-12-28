import express from 'express'
import jwt from 'jsonwebtoken'

import { response } from '../response.js'

function verifyJwt(req, res, next){
    const token = req.cookies.accessToken

    if(!token){return response(res, false, "token expired")}

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY)
        req.user = decoded
        next()
    } catch(err) {
        if (err.name === 'TokenExpiredError') {
            return response(res, false, "token expired")
        } else if (err.name === 'JsonWebTokenError') {
            return response(res, false, "token invalid")
        }
        return response(res, false, "server error")
    }
}

export default verifyJwt