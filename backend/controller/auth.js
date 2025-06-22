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
    const token = 'Bearer ' + jwt.sign(payload, process.env.JWT_SECRETKEY, {expiresIn:"20m"})

    // res.cookie('token', token, {
    //     httpOnly: false,    // Supaya aman (tidak bisa dibaca JS)
    //     sameSite: 'Lax',   // Boleh lintas halaman
    //     path: '/',         // Berlaku untuk semua path
    //     secure: false,   // Hanya untuk HTTPS (aktif jika pakai ngrok)
    //     maxAge: 24 * 60 * 60 * 1000
    // });
    return response(200, true, "login successfull", {user: payload, token: token}, res)
}

authController.logout = async (req, res) => {
    console.log('logout endpoint hit')
}



// //userId 684d29dbf04c80610c017d4a


export default authController
