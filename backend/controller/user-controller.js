import bcrypt from 'bcrypt'
import { randomUUID } from "crypto"

import * as redisHelper from '../utils/redis-helper.js'
import * as UserModel from '../model/user-model.js'
import * as userSchema from "../schema/user-schema.js";


import { response } from '../utils/response.js'
import { validate } from "../utils/validate.js";
import { sendMail } from "../utils/mailer.js"



const userController = {}

userController.resetPassword = async (req, res) => {
    try {
        const email = await UserModel.getEmailForResetPassword({id: req.user.id})
        if(!email){return response(res, false, "kamu belum mendaftarkan email")}

        const token = randomUUID()
        const {ok} = await redisHelper.set("reset-password", token, {id: req.user.id})
        if(!ok){return response(res, false, "tolong coba lagi")}
        //max limit
        sendMail.resetPassword({email, token})
        return response(res, false, "link reset password berhasil terkirim")
    }catch(err){
        console.log(err)
        return response(res, false, "server error", null, 500)   
    }
}

userController.verifyResetPassword = async (req, res) => {
    const {ok, value: token} = validate(userSchema.tokenUUID, req.query.token)
    if(!ok){return response(res, false, "link invalid")}
    const {ok: ok2, value: password, message: message2} = validate(userSchema.password, req.body.password)
    if(!ok2){return response(res, false, message2)}

    try {
        console.log(token)
        const {ok: ok3, data: id} = await redisHelper.get("reset-password", token)
        if(!ok3){return response(res, false, "link invalid atau expired")}
        await redisHelper.del("reset-password", token)

        const changedRows = await UserModel.setPassword({id, password})
        if(!changedRows){return response(res, false, "user tidak ditemukan")}
        return response(res, true, "password berhasil diubah")
    }catch(err){
        console.log(err)
        return response(res, false, "server error", null, 500)   
    }
}



userController.verifyEmail = async (req, res) => {
    const {ok, value: token} = validate(userSchema.tokenUUID, req.query.token)
    if(!ok){return response(res, false, "link invalid")}

    const {ok: ok2, data} = await redisHelper.get("update-email", token)
    if(!ok){return response(res, false, "link expired")}
    await redisHelper.del("update-email", token)

    try {
        const changedRows = await UserModel.setEmail(data)
        if(!changedRows){return response(res, false, "akun tidak ditemukan")}
        return response(res, true, "verifikasi berhasil")
    }catch(err) {
        if(err.message === "duplicate"){return response(res, false, "email sudah digunakan")}
        return response(res, false, "server error")
    }
}

userController.updateUsername = async (req, res) => {
    const {ok, value: {newUsername, password}, message} = validate(userSchema.updateUsername, req.body)
    if(!ok){return response(res, false, message)}
    console.log(newUsername)

    try {
        const user = await UserModel.getUserForUsernameChange({id: req.user.id})
        if(!user){return response(res, false, "user tidak ditemukan", null, 401)}
        if(user.username === newUsername){return response(res, false, "username tidak boleh sama dengan yang lama")}
        
        
        const matchPassword = await bcrypt.compare(password, user.password)
        if(!matchPassword){return response(res, false, "password salah")}
        
        const changedRows = await UserModel.setUsername({id: req.user.id, username: newUsername})
        if(!changedRows){return response(res, false, "user tidak ditemukan", null, 401)}

        const {ok:ok3, data: socketId} = await redisHelper.get("socket", user.username)
        if(ok3){
            await forceDisconnect(socketId)
            await redisHelper.del("socket", user.username)
        }

        return response(res, true, "username berhasil dirubah")


    } catch(err) {
        if(err.message === "duplicate"){return response(res, false, "username sudah digunakan")}
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}

userController.updateEmail = async (req, res) => {
    const {ok, value: {newEmail, password}, message} = validate(userSchema.updateEmail, req.body)
    if(!ok){return response(res, false, message)}

    try {
        const user = await UserModel.getUserForEmailChange({id: req.user.id})
        if(!user){return response(res, false, "user tidak ditemukan", null, 401)}
        
        const matchPassword = await bcrypt.compare(password, user.password)
        if(!matchPassword){return response(res, false, "password salah")}

        const isExist = await UserModel.checkEmail({email: newEmail})
        if(isExist){return response(res, false, "email sudah digunakan")}

        const token = randomUUID()

        const {ok: ok2} = await redisHelper.set("update-email", token, {email: newEmail, id: req.user.id})
        if(!ok2){return response(res, false, "tolong coba lagi")}
        //max ratelimit
        
        sendMail.verifyEmail({newEmail, token})
        return response(res, true, "link verifikasi berhasil terkirim")
    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}


userController.getAllUsers = async (req, res) => {
    try {
        const allUsers = await UserModel.getAllUsers()
    
        return response(res, true, "retrieved all users", allUsers)
    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}
userController.getMyData = async (req, res) => {
    try {
        const user = await UserModel.getMyData({id: req.user.id})
        if(!user){return response(res, false, "user not found", null, 404)}

        return response(res, true, 'retrieved your profile', user)
    } catch(err) {
        return response(res, false, "server error", null, 500)
    }
}
export default userController
