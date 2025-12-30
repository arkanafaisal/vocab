import Joi from 'joi'
import { getDb } from '../db.js'
import redis from '../redis.js'
import { response } from '../response.js'
import { ObjectId } from 'mongodb'

const dataController = {}

dataController.insertData = async (req, res) => {
    console.log('insert endpoint hit')
    const { data_access_token, datas } = req.body
    if(data_access_token !== process.env.DATA_ACCESS_TOKEN){return response(res, false, "akses tidak diizinkan")}

    const dataSchema = Joi.object({
        vocab: Joi.string().min(2).max(12).required(),
        meaning: Joi.string().min(3).max(16).required()
    })

    if(!Array.isArray(datas)) return response(res, false, "invalid input")

    for(let i = 0; i < datas.length; i++){
        const {error} = dataSchema.validate(datas[i])
        if(error) {
            response(res, false, "invalid input at index: " + i)
            return 
        } 
    }
    const db = getDb()
    try {
        const result = await db.collection('datas').insertMany(datas)
            
        return response(res, true, "data berhasil dimasukkan", result)
    } catch(error) {
        if(error.code !== 11000){return response(res, false, "error when inserting", null)}
        
        return response(res, false, error.writeErrors[0].err.errmsg)
    }
}


dataController.deleteData = async (req, res) => {
    const { data_access_token, datas } = req.body
    if(!Array.isArray(datas)) return response(res, false, "invalid input")
    if(datas.length === 0){return response(res, false, "missing input data")}
    if(data_access_token !== process.env.DATA_ACCESS_TOKEN){return response(res, false, "access denied")}

    const dataSchema = Joi.object({
        vocab: Joi.string().min(2).max(12).required(),
        meaning: Joi.string().min(3).max(16).required()
    })
    for(let i = 0;i < datas.length; i++){
        const {error} = dataSchema.validate(datas[i])
        if(error){ 
            return response(res, false, "invalid input at index: " + i)
        }
    }

    let deleteQuery = {$or: datas}
    try {
        const db = getDb()
        
        const result = await db.collection('datas').deleteMany(deleteQuery)
        if(!result.acknowledged){return response(res, false, "error when deleting")}

        return response(res, true, "successfully deleteing", result.deletedCount)


    } catch(error) {
        console.log(error)
        return response(res, false, "error when deleting")
    }
}


dataController.getData = async (req, res) => {
    try {
        const db = getDb()
        const randomData = await db.collection('datas').aggregate([
            {$project: {_id: 0, vocab: 1, meaning: 1}},
            {$sample: {size : 5}}
        ]).toArray()
        const randomMeaning = await db.collection('datas').aggregate([
            {$project: {_id: 0, meaning: 1}},
            {$sample: {size : 5*4}}
        ]).toArray()

        let randomMeaning2 = randomMeaning.map(item => item.meaning)
        
        const batchId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
        let questions = []
        let answers = []
        randomData.forEach(data => {
            const choices = randomMeaning2.splice(0,4)
            const randomIndex = Math.floor(Math.random() * 5)
            choices.splice(randomIndex, 0, data.meaning)

            questions.push({
                vocab: data.vocab,
                choices
            })
            answers.push(data.meaning)
        })

        redis.set(`vocab:answers:${batchId}`, JSON.stringify(answers), {EX: 300})
        return response(res, true, "successfully getting question", [batchId, questions])
    } catch(error) {
        console.error(error)
        return response(res, false, "database error")
    }
}

dataController.validateAnswer = async (req, res) => {
    const reqSchema = Joi.object({
        batchId: Joi.string().required(),
        answer: Joi.string().required()
    })
    const {error, value} = reqSchema.validate(req.body)
    if(error){return response(res, false, error.details[0].message)}

    try {
        const key = `vocab:answers:${value.batchId}`
        const rawData = await redis.get(key)
        if(!rawData){return response(res, false, "batch expired")}
        const data = JSON.parse(rawData)

        const correctAnswer = data[0]
        
        if(data.length === 1){await redis.del(key)}
        else{
            data.shift()
            await redis.set(key, JSON.stringify(data), {'EX': 300})
        }

        if(correctAnswer !== value.answer){return response(res, true, "incorrect", correctAnswer)}

        const db = getDb()
        const updatedUser = await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.id) },
            { $inc: { score: 1 } }
        )
        if(!updatedUser.acknowledged || updatedUser.matchedCount === 0 || updatedUser.modifiedCount === 0){return response(res, false, "server error")}

        return response(res, true, "correct")
    } catch(err) {
        console.log(err)
        return response(res, false, "server error")
    }
}

export default dataController