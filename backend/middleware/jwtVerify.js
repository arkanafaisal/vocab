import express from 'express'
import jwt from 'jsonwebtoken'

import { response } from '../response.js'

function verifyJwt(req, res, next){
    console.log('verifying jwt...')
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){return response(401, false, "please login first", null, res)}

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY)
        req.user = decoded
        console.log('jwt verified')
        next()
    } catch(err) {
        if (err.name === 'TokenExpiredError') {
            return response(403, false, "token expired", null, res)
        } else if (err.name === 'JsonWebTokenError') {
            return response(403, false, "token invalid", null, res)
        }
        return response(403, false, "error when verifying token", null, res)
    }
}

export default verifyJwt