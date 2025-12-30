import express from 'express'
import { response } from '../response.js'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'

const usersController = {}

usersController.getAllUsers = async (req, res) => {
    try {
        const db = getDb()
        const users = await db.collection("users").find(
            {},
            { projection: { _id: 0, username: 1, score: 1 } }
        ).toArray()
    
        return response(res, true, "retrieved all users", users)
    } catch(err) {
        return response(res, false, "server error")
    }
}

export default usersController
