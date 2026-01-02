import express from 'express'

import verifyJwt from '../middleware/jwtVerify.js'
import rateLimiting from '../middleware/rateLimiting.js'

import userController from '../controller/user-controller.js'

const userRouter = express.Router()

userRouter.get('/',    rateLimiting("getAllUsers", 1, 90),     userController.getAllUsers)
userRouter.get('/me',  rateLimiting('getMyProfile', 1, 120),   verifyJwt, userController.getMyData)

export default userRouter