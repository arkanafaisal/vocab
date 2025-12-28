import express from 'express'

import usersController from '../controller/users.js'

const usersRouter = express.Router()
// usersRouter.use((req,res,next)=>{
//     console.log('users endpoint hit')
//     next()
// })

usersRouter.get('/', usersController.getAllUsers)

export default usersRouter
