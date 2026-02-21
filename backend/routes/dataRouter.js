import express from 'express'

import rateLimiting from '../middleware/rateLimiting.js'

import dataController from '../controller/data-controller.js'

const dataRouter = express.Router()

dataRouter.post('/insert',  rateLimiting('inserData', 1, 2),                    dataController.insertData)
dataRouter.post('/delete',  rateLimiting('deleteData', 1, 5),                   dataController.deleteData)

export default dataRouter