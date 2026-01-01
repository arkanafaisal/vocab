import express from 'express'
import dataController from '../controller/data.js'
import verifyJwt from '../middleware/jwtVerify.js'
import rateLimiting from '../middleware/rateLimiting.js'

const dataRouter = express.Router()
// dataRouter.use('/', (req, res, next)=>{
//     console.log('data endpoint hit')
//     next()
// })

dataRouter.post('/insert',  rateLimiting('inserData', 1, 2),                    dataController.insertData)
dataRouter.post('/delete',  rateLimiting('deleteData', 1, 5),                   dataController.deleteData)
dataRouter.get('/get/',     rateLimiting('getQuizData', 1, 45),                 dataController.getData)
dataRouter.post('/answer/', rateLimiting('verifyAnswer', 1, 90),    verifyJwt,  dataController.validateAnswer)

export default dataRouter