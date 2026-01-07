import Joi from 'joi'

const data = Joi.object({
    vocab: Joi.string().trim().min(2).max(12).required(),
    meaning: Joi.string().trim().min(3).max(16).required()
})

export const insert = Joi.object({
    data_access_token: Joi.string().valid(process.env.DATA_ACCESS_TOKEN).required(),
    datas: Joi.array().items(data).min(1).required()
})

const vocabObject = Joi.object({
    vocab: Joi.string().trim().min(2).max(12).required(),
})
export const remove = Joi.object({
    data_access_token: Joi.string().valid(process.env.DATA_ACCESS_TOKEN).required(),
    datas: Joi.array().items(vocabObject).min(1).required()
})


export const answer = Joi.object({
    batchId: Joi.string().required(),
    answer: Joi.string().trim().min(3).max(16).required()
})