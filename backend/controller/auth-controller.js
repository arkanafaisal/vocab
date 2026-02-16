
import jwt from 'jsonwebtoken'


import * as redisHelper from "../utils/redis-helper.js"
import * as UserModel from '../model/user-model.js';
import * as userSchema from "../schema/user-schema.js";

import { validate } from "../utils/validate.js";
import { response } from '../utils/response.js';

const authController = {}

const cookieOptions = {
    accessToken: {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        path: '/',
        maxAge: 10* 60 * 1000
    },
    refreshToken: {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        path: '/',
        maxAge: 168 * 60 * 60 * 1000
    }
}

authController.register = async (req, res) => {
    const {ok, value, message} = validate(userSchema.user, req.body)
    if(!ok){return response(res, false, message)}

    try {
        const insertedId = await UserModel.insertUser(value)
        if(!insertedId){return response(res, false, "could not register user")}
        
        return response(res, true, "user registered")


    } catch(err) {
        if(err.message === "duplicate"){return response(res, false, "user already exist")}
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}

authController.login = async (req, res) => {
    const { username, email, password } = req.body

    const type = username ? 'username' : 'email'
    const identifier = username || email

    const { ok, message } = validate(
        username ? userSchema.userWithUsername : userSchema.userwithEmail,
        req.body
    )
    if (!ok) return response(res, false, message)



    try {
        const user = await UserModel.authenticateUser(type, identifier, password)
        if(!user){return response(res, false, "username or password incorrect")}
    
        const payload = {id: user.id}
        const accessToken = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"10m"})
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRETKEY, {expiresIn:"168h"})

        const {ok: ok2} = await redisHelper.set('tokens', refreshToken, 'a')
        if(!ok2){return response(res, false, "error, please try again")}
        
        res.cookie('accessToken', accessToken, cookieOptions.accessToken)
        res.cookie('refreshToken', refreshToken, cookieOptions.refreshToken)

        return response(res, true, "login successfull", {username: user.username, score: user.score})


    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}

authController.logout = async (req, res) => {
    res.clearCookie("refreshToken", cookieOptions.refreshToken)
    res.clearCookie("accessToken", cookieOptions.accessToken)

    if(req.cookies.refreshToken){
        const {ok} = await redisHelper.del('tokens', req.cookies.refreshToken)
        if(!ok){return response(res, true, "logout not fully successfull")}
    }

    return response(res, true, "logout success")
}

authController.refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    if(!refreshToken) return response(res, false, 'refresh token invalid')

        
    try {
        const decodedJwt = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRETKEY)

        const {ok: ok} = await redisHelper.get('tokens', refreshToken)
        if(!ok){return response(res, false, "refresh token invalid")}
        
        
        
        const isExist = await UserModel.verifyUserById({id: decodedJwt.id})
        if(!isExist) {
            await redisHelper.del('tokens', refreshToken)
            res.clearCookie("refreshToken", cookieOptions.refreshToken)
            res.clearCookie("accessToken", cookieOptions.accessToken)

            return response(res, false, 'refresh token invalid')
        }


        const payload = {id: decodedJwt.id}
        const accessToken = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"10m"})
        res.cookie('accessToken', accessToken, cookieOptions.accessToken)

        return response(res, true, "new token created")


    } catch(err){
        if(err.name === "TokenExpiredError"){return response(res, false, "refresh token expired")}
        if(err.name === "JsonWebTokenError"){return response(res, false, "refresh token invalid")}
        return response(res, false, "server error", null, 500)
    }
}

export default authController
