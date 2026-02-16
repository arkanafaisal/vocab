import Joi from 'joi'

export const user = Joi.object({
    username: Joi.string().trim().max(15).pattern(/^[a-zA-Z0-9]+$/).required(),
    email: Joi.string().email().trim().max(31),
    password: Joi.string().trim().max(255).required()
})

export const userWithUsername = Joi.object({
    username: Joi.string().trim().max(15).pattern(/^[a-zA-Z0-9]+$/).required(),
    password: Joi.string().trim().max(255).required()
})

export const userwithEmail = Joi.object({
    email: Joi.string().email().trim().max(31).required(),
    password: Joi.string().trim().max(255).required()
})
