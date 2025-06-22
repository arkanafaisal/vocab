import express from 'express'
import { response } from '../response.js'

import usersController from '../controller/users.js'

const usersRouter = express.Router()
usersRouter.use((req,res,next)=>{
    console.log('users endpoint hit')
    next()
})

usersRouter.get('/', usersController.getAllUsers)
usersRouter.get('/:id', usersController.getUserById)

export default usersRouter
