import express from 'express';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { response } from '../response.js';
import { getDb } from '../db.js'

const authController = {}

authController.register = async (req, res) => {
    console.log("register endpoint hit")
    const { username, email, password } = req.body;
    if (!username || !email || !password) {return response(400, false, "please fill all the form", null, res);}

    const db = getDb()
    const isUserExists = await db.collection('users').findOne({ username });
    if (isUserExists) {return response(409, false, 'Account already exists', null, res);}
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = { username, email, password:hashedPassword, score: 0}
    const insertResult = await db.collection('users').insertOne(newUser);
    if (!insertResult.acknowledged) {return response(500, false, 'error, please try again', null, res);}
    
    return response(201, true, 'User registered successfully', { userId: insertResult.insertedId }, res);
}





authController.login = async (req, res) => {
    console.log("login endpoint hit")
    const { username, password } = req.body
    if(!username || !password){return response(400, false, "please fill all the form", null, res)}

    const db = getDb()
    const findUser = await db.collection('users').findOne({username})
    if(!findUser){return response(404, false, "username or password incorrect", null, res)}

    const matchPassword = await bcrypt.compare(password, findUser.password)
    if(!matchPassword){return response(404, false, "username or password incorrect", null, res)}

    const payload = {id: findUser._id, username: findUser.username, score: findUser.score}
    const token = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"1m"})

    if(!req.cookies.refreshToken){
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRETKEY, {expiresIn:"168h"})
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,    // Supaya aman (tidak bisa dibaca JS)
            sameSite: 'None',   // Boleh lintas halaman
            path: '/',         // Berlaku untuk semua path
            secure: true,   // Hanya untuk HTTPS (aktif jika pakai ngrok)
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
    return response(200, true, "login successfull", {user: payload, token: token}, res)
}

authController.logout = async (req, res) => {
    console.log('logout endpoint hit')
    res.clearCookie("refreshToken", {
        httpOnly: true,    
        sameSite: 'None', 
        path: '/',     
        secure: true,
    })
    return response(200, true, "log out success", null, res)
}

authController.refreshToken = async (req, res) => {
    console.log("getting new access token")
    try {
        const decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRETKEY)
        const payload = {id: decoded._id, username: decoded.username, score: decoded.score}
        const newToken = jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"1m"})
        return response(200, true, "new token created", newToken, res)
    } catch(err){
        if(err.name === "TokenExpiredError"){return response(403, false, "refresh token expired", null, res)}
        if(err.name === "JsonWebTokenError"){return response(403, false, "refresh token invalid", null, res)}
        return response(403, false, "error when verifying token", null, res)
    }
}


export default authController
