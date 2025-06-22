import express from 'express'
import { response } from '../response.js'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'

const usersController = {}

usersController.getAllUsers = async (req, res) => {
    console.log("all endpoint hit")

    const db = getDb()
    const allUSer = await db.collection("users").find(
        {},
        { projection: { _id: 1, username: 1, score: 1 } }
    ).toArray()

    if(!allUSer){return response(404, false, "error when getting data", null, res)}
    return response(200, true, "successfully getting all user", allUSer, res)
}

usersController.getUserById = async (req, res) => {
    console.log(`getting user by id: ${req.params.id}`)
    if(!ObjectId.isValid(req.params.id)){return response(400, false, "id must be in a correct format", null, res)}

    const db = getDb()
    const user = await db.collection('users').findOne({_id : new ObjectId(req.params.id)}, {projection: {username:1, email:1, score:1}})
    if(!user){return response(401, false, "user not found", null, res)}
    return response(200, true, "user found", user, res)
}

export default usersController
