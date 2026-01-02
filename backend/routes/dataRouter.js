import express from 'express'

import verifyJwt from '../middleware/jwtVerify.js'
import rateLimiting from '../middleware/rateLimiting.js'

import dataController from '../controller/data-controller.js'

const dataRouter = express.Router()

dataRouter.post('/insert',  rateLimiting('inserData', 1, 2),                    dataController.insertData)
dataRouter.post('/delete',  rateLimiting('deleteData', 1, 5),                   dataController.deleteData)
dataRouter.get('/get/',     rateLimiting('getQuizData', 1, 45),                 dataController.getVocabData)
dataRouter.post('/answer/', rateLimiting('verifyAnswer', 1, 90),    verifyJwt,  dataController.validateAnswer)

export default dataRouter