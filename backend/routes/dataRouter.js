import express from 'express'
import dataController from '../controller/data.js'
import verifyJwt from '../middleware/jwtVerify.js'

const dataRouter = express.Router()
// dataRouter.use('/', (req, res, next)=>{
//     console.log('data endpoint hit')
//     next()
// })

dataRouter.post('/insert', dataController.insertData)
dataRouter.post('/delete', dataController.deleteData)
dataRouter.get('/get/', dataController.getData)
dataRouter.post('/answer/', verifyJwt, dataController.validateAnswer)

export default dataRouter