import { ObjectId } from 'mongodb'

import { getDb } from '../db.js'

import { response } from '../response.js'

const profileController = {}

profileController.getData = async (req, res) => {
    try {
        const db = getDb()
        const id = new ObjectId(req.user.id)
        
        const result = await db.collection("users").findOne({_id: id}, { projection: { _id: 0, username: 1, score: 1 }})
        
        if(!result){return response(res, false, "user not found")}
        return response(res, true, "successfully getting data", result)
    } catch(err) {
        return response(res, false, "server error")
    }
}

profileController.changeUserData = async (req, res) => {
    let { score } = req.body
    

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