import express from 'express'

import usersController from '../controller/users.js'
import rateLimiting from '../middleware/rateLimiting.js'

const usersRouter = express.Router()
// usersRouter.use((req,res,next)=>{
//     console.log('users endpoint hit')
//     next()
// })

usersRouter.get('/',    rateLimiting("getAllUsers", 1, 45), usersController.getAllUsers)

export default usersRouter
