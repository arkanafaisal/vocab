import express from 'express'
import jwt from 'jsonwebtoken'

import { response } from '../response.js'

function verifyJwt(req, res, next){
    console.log('verifying jwt...')
    const authHeader = req.headers.token
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){return response(401, false, "please login first", null, res)}

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY)
        req.user = decoded
        console.log('jwt verified')
        next()
    } catch(error) {
        return response(403, false, "please login again", null, res)
    }
}

export default verifyJwt