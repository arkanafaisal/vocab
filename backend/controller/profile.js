import express from 'express'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

import { getDb } from '../db.js'

import { response } from '../response.js'

const profileController = {}

profileController.getData = async (req, res) => {
    console.log("get endpoint hit")
    
    const db = getDb()
    const result = await db.collection("users").findOne({username: req.user.username})

    return response(200, true, "successfully getting score", {username: result.username, email: result.email, score: result.score}, res)
}

profileController.changeUserData = async (req, res) => {
    console.log('changeData endpoint hit')
    let { score } = req.body
    if(typeof score !== "number"){return response(400, false, "score isnt defined", null, res)}

    const db = getDb()

    const user = await db.collection("users").findOne({username: req.user.username})
    if(score - user.score > 1 || score < user.score){return response(400, false, "cheating detected", null, res)}

    const result = await db.collection('users').updateOne(
        { username: req.user.username },
        { $set: { score: score } }
    )
    if(!result.acknowledged){return response(404, false, "error when updating data", null, res)}

    return response(200, true, "successfully updating score", score, res)
}

export default profileController