
import jwt from 'jsonwebtoken'
import redis from '../config/redis.js'
import {randomUUID} from 'crypto'


import * as redisHelper from "../utils/redis-helper.js"
import * as UserModel from '../model/user-model.js';
import * as userSchema from "../schema/user-schema.js";

import { validate } from "../utils/validate.js";
import { response } from '../utils/response.js';
import { forceDisconnect } from '../config/socket.js';

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

        await redis.incrBy(`vocab:rl:register:${req.ip}`, 15)
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
        const refreshToken = randomUUID()

        const {ok: ok2} = await redisHelper.set('tokens', refreshToken, user.id)
        if(!ok2){return response(res, false, "error, please try again")}
        
        res.cookie('accessToken', accessToken, cookieOptions.accessToken)
        res.cookie('refreshToken', refreshToken, cookieOptions.refreshToken)


        const {ok:ok3, data: socketId} = await redisHelper.get("socket", user.username)
        if(ok3){
            await forceDisconnect(socketId)
            await redisHelper.del("socket", user.username)
        }
        
        await redis.incrBy(`vocab:rl:login:${req.ip}`, 10)
        return response(res, true, "login successfull", user)


    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}

authController.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    if(refreshToken){
        (async () => {
            for(let i = 0; i < 3; i++){
                const {ok} = await redisHelper.del('tokens', refreshToken)
                if(ok) break
                await new Promise(r => setTimeout(r, 500))
            }
        })()
    }

    res.clearCookie("refreshToken", cookieOptions.refreshToken)
    res.clearCookie("accessToken", cookieOptions.accessToken)
    


    return response(res, true, "logout success")
}

authController.refreshToken = async (req, res) => {
    const oldToken = req.cookies.refreshToken
    if(!oldToken) return response(res, false, 'selamat datang', null, 403)
        
        
    try {
        const newToken = randomUUID()
        const id = await redis.eval(`
            local userId = redis.call("GET", KEYS[1])
            if not userId then return nil end

            redis.call("DEL", KEYS[1])
            redis.call("SET", KEYS[2], userId, "EX", ARGV[1])

            return userId
        `,  {
                keys: [redisHelper.redisKey("tokens", oldToken), redisHelper.redisKey("tokens", newToken)],
                arguments: [String(60 * 60 * 168)]
            })
    
    
        if(!id) return response(res, false, 'silakan login kembali', null, 403)

        
        const isExist = await UserModel.verifyUserById({id})
        if(!isExist) {
            await redisHelper.del('tokens', newToken)
            res.clearCookie("refreshToken", cookieOptions.refreshToken)
            res.clearCookie("accessToken", cookieOptions.accessToken)

            return response(res, false, 'refresh token invalid')
        }


        const payload = {id}
        const accessToken = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"10m"})
        res.cookie('accessToken', accessToken, cookieOptions.accessToken)
        res.cookie('refreshToken', newToken, cookieOptions.refreshToken)

        return response(res, true, "new token created")


    } catch(err){
        console.log(err)
        if(err.name === "TokenExpiredError"){return response(res, false, "refresh token expired", null, 403)}
        if(err.name === "JsonWebTokenError"){return response(res, false, "refresh token invalid", null, 403)}
        return response(res, false, "server error", null, 500)
    }
}

export default authController
