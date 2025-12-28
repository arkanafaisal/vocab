import Joi from "joi"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { response } from '../response.js';
import { getDb } from '../db.js'

const authController = {}

authController.register = async (req, res) => {
    const { username, password } = req.body;
    const userSchema = Joi.object({
        username: Joi.string().max(15).pattern(/^[a-zA-Z0-9]+$/).required(),
        password: Joi.string().max(255).required()
    })
    const {error, value} = userSchema.validate({username, password})
    if(error){return response(res, false, error.details[0].message)}

    try {
        const db = getDb()
      
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = { username, password:hashedPassword, score: 0}

        const insertResult = await db.collection('users').insertOne(newUser)
        if(!insertResult.acknowledged){return response(res, false, "failed to create user")}
        
        return response(res, true, "user created");
    } catch(err) {
        if(err.code === 11000){return response(res, false, "user already exist")}
        return response(res, false, "server error")
    }
}

authController.login = async (req, res) => {
    const { username, password } = req.body
    const loginSchema = Joi.object({
        username: Joi.string().max(15).pattern(/^[a-zA-Z0-9]+$/).required(),
        password: Joi.string().max(255).required()
    })
    const { error, value } = loginSchema.validate({username, password})
    if(error){return response(res, false, error.details[0].message)}

    try {
        const db = getDb()
        const user = await db.collection('users').findOne({username})
        if(!user){return response(res, false, "username or password incorrect")}
    
        const matchPassword = await bcrypt.compare(password, user.password)
        if(!matchPassword){return response(res, false, "username or password incorrect")}
    
        const payload = {id: user._id}
        const accessToken = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"10m"})
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'none', //secure
            secure: true, //true
            path: '/',
            maxAge: 10 * 60 * 1000
        })

        if(!req.cookies.refreshToken){
            const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRETKEY, {expiresIn:"168h"})
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'none', //secure
                secure: true, //true
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }
        return response(res, true, "login successfull")
    } catch(err) {
        console.log(err)
        return response(res, false, "server error")
    }
}

authController.logout = async (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,    
        sameSite: 'None', 
        path: '/',     
        secure: true,
    })
    return response(res, true, "logout success")
}

authController.refreshToken = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRETKEY)
        const payload = {id: decoded.id}
        const accessToken = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"10m"})
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'Lax', //secure
            secure: false, //true
            path: '/',
            maxAge: 10* 60 * 1000
        })
        return response(res, true, "new token created")
    } catch(err){
        if(err.name === "TokenExpiredError"){return response(res, false, "refresh token expired")}
        if(err.name === "JsonWebTokenError"){return response(res, false, "refresh token invalid")}
        return response(res, false, "server error")
    }
}


export default authController
