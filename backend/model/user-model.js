import { ObjectId } from "mongodb"
import { getDb } from "../config/db.js"
import bcrypt from 'bcrypt'

export async function insertUser({username, password}) {
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = { username, password: hashedPassword, score: 0 }
    
    try {
        const db = getDb()
        const { insertedId } = await db.collection('users').insertOne(newUser)
        return insertedId
    } catch (err) {
        if (err.code === 11000) throw new Error('duplicate')
        throw err
    }
}

export async function authenticateUser({username, password}) {
    const db = getDb()
    const user = await db.collection('users').findOne({username})
    if(!user){return null}

    const matchPassword = await bcrypt.compare(password, user.password)
    if(!matchPassword){return null}

    return {id: user._id}
}

export async function getUserById({id}) {
    const db = getDb()
    const mongoId = new ObjectId(id)
    const user = await db.collection('users').findOne(
        {_id: mongoId}
    )

    return {id: user._id}
}

export async function addUserScore({id}) {
    const db = getDb()
    const mongoId = new ObjectId(id)

    const {matchedCount} = await db.collection('users').updateOne(
        { _id: mongoId},
        { $inc: { score: 1 } }
    )

    return matchedCount
}

export async function getAllUsers() {
    const db = getDb()
    const allUsers = await db.collection("users").find(
        {},
        { projection: { _id: 0, username: 1, score: 1 } }
    ).toArray()

    return allUsers
}


export async function getMyData({id}) {
    const db = getDb()
    const mongoId = new ObjectId(id)
    const user = await db.collection("users").findOne(
        {_id: mongoId}, 
        { projection: { _id: 0, username: 1, score: 1 }}
    )
    
    return user
}