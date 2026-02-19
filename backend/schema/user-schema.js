import Joi from 'joi'


const username = Joi.string().trim().max(15).pattern(/^[a-zA-Z0-9]+$/).required()
export const password = Joi.string().trim().max(255).required()
const email = Joi.string().email().trim().max(31)
const emailRequired = Joi.string().email().trim().max(31).required()

export const tokenUUID = Joi.string().guid({ version: 'uuidv4' }).required()

export const user = Joi.object({
    username,
    email,
    password
})

export const userWithUsername = Joi.object({
    username,
    password
})

export const userwithEmail = Joi.object({
    email: emailRequired,
    password
})

export const updateUsername = Joi.object({
    newUsername: username,
    password
})

export const updateEmail = Joi.object({
    newEmail: emailRequired,
    password
})

