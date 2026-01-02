import Joi from 'joi'

export const user = Joi.object({
    username: Joi.string().trim().max(15).pattern(/^[a-zA-Z0-9]+$/).required(),
    password: Joi.string().trim().max(255).required()
})