import * as DataSchema from '../schema/data-schema.js'
import * as DataModel from '../model/data-model.js'
import * as UserModel from '../model/user-model.js'
import * as redisHelper from '../utils/redis-helper.js'

import { validate } from '../utils/validate.js'
import { response } from '../utils/response.js'

const dataController = {}

dataController.insertData = async (req, res) => {
    console.log('insert endpoint hit')
    const {ok, message, value} = validate(DataSchema.insert, req.body)
    if(!ok){return response(res, false, message)}

    
    try {
        const insertedCount = await DataModel.insertData({datas: value.datas})
        return response(res, true, "successfully inserted the datas", insertedCount)
    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}


dataController.deleteData = async (req, res) => {
    const {ok, message, value} = validate(DataSchema.remove, req.body)
    if(!ok){return response(res, false, message)}
    
    try {
        const deletedCount = await DataModel.deleteData({datas: value.datas})
        return response(res, true, "successfully deleting data", deletedCount)
    } catch(error) {
        console.log(error)
        return response(res, false, "server error", null, 500)
    }
}

///not finished 
dataController.getVocabData = async (req, res) => {
    try {
        const {randomData, randomMeaning} = await DataModel.getRandomQuizData()
        const batchId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
        let questions = []
        let answers = []
        randomData.forEach(data => {
            const choices = randomMeaning.splice(0,4)
            const randomIndex = Math.floor(Math.random() * 5)
            choices.splice(randomIndex, 0, data.meaning)

            questions.push({
                vocab: data.vocab,
                choices
            })
            answers.push(data.meaning)
        })

        const {ok} = await redisHelper.set('answers', batchId, answers)
        if(!ok){return response(res, false, "failed to get vocab data")}

        return response(res, true, "successfully getting question", {batchId, questions})
    } catch(error) {
        console.error(error)
        return response(res, false, "server error", null, 500)
    }
}

dataController.validateAnswer = async (req, res) => {
    const {ok, message, value: userRequest} = validate(DataSchema.answer, req.body)
    if(!ok){return response(res, false, message)}


    try {
        const {ok: ok2, data: answers} = await redisHelper.get('answers', userRequest.batchId)
        if(!ok2){return response(res, false, "batch expired")}

        const correctAnswer = answers[0]
        
        if(answers.length === 1){await redisHelper.del('answers', userRequest.batchId)}
        else{
            answers.shift()
            const {ok: ok3} = await redisHelper.set('answers', userRequest.batchId, answers)
            if(!ok3){return response(res, false, "failed to validate answer")}
        }

        if(correctAnswer !== userRequest.answer){return response(res, true, "incorrect", correctAnswer)}
        const matchedCount = await UserModel.addUserScore({id: req.user.id})
        if(!matchedCount){return response(res, false, 'user not found', null, 404)}

        await redisHelper.del('cache', `userData:${req.user.id}`)
        await redisHelper.del('cache', 'allUserData')

        return response(res, true, "correct")
    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}

export default dataController