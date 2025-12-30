import { ObjectId } from 'mongodb'

import { getDb } from '../db.js'

import { response } from '../response.js'
import redis from '../redis.js'

const profileController = {}

profileController.getData = async (req, res) => {
    try {
        const rawData = await redis.get(`vocab:cache:userData:${req.user.id}`)
        if(rawData){return response(res, true, "successfully getting data", JSON.parse(rawData))}
        const db = getDb()
        const id = new ObjectId(req.user.id)
        
        const result = await db.collection("users").findOne({_id: id}, { projection: { _id: 0, username: 1, score: 1 }})
        
        if(!result){return response(res, false, "user not found")}

        await redis.set(`vocab:cache:userData:${req.user.id}`, JSON.stringify(result), {"EX": 600})
        return response(res, true, "successfully getting data", result)
    } catch(err) {
        return response(res, false, "server error")
    }
}

export default profileController