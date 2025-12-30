import express from 'express'
import { response } from '../response.js'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'
import redis from '../redis.js'

const usersController = {}

usersController.getAllUsers = async (req, res) => {
    try {
        const rawData = await redis.get(`vocab:cache:allUserData`)
        if(rawData){return response(res, true, "retrieved all users", JSON.parse(rawData))}
        const db = getDb()
        const users = await db.collection("users").find(
            {},
            { projection: { _id: 0, username: 1, score: 1 } }
        ).toArray()

        await redis.set(`vocab:cache:allUserData`, JSON.stringify(users), {"EX": 600})
    
        return response(res, true, "retrieved all users", users)
    } catch(err) {
        return response(res, false, "server error")
    }
}

export default usersController
