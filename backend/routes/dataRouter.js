import express from 'express'
import dataController from '../controller/data.js'

const dataRouter = express.Router()
dataRouter.use('/', (req, res, next)=>{
    console.log('data endpoint hit')
    next()
})

dataRouter.post('/insert', dataController.insertData)
dataRouter.post('/delete', dataController.deleteData)
dataRouter.get('/get/:number', dataController.getData)

export default dataRouter