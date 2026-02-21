import express from 'express'

import verifyJwt from '../middleware/jwtVerify.js'
import rateLimiting from '../middleware/rateLimiting.js'

import userController from '../controller/user-controller.js'

const userRouter = express.Router()

userRouter.get('/',    rateLimiting("getAllUsers", 1, 30),     userController.getAllUsers)
userRouter.get('/me',  rateLimiting('getMyProfile', 1, 120),   verifyJwt, userController.getMyData)

userRouter.patch('/update-username', rateLimiting('update-username', 15, 10), verifyJwt, userController.updateUsername)
userRouter.patch('/update-email', rateLimiting('update-email', 30, 20), verifyJwt, userController.updateEmail)
userRouter.patch('/reset-password', rateLimiting('reset-password', 15, 10), verifyJwt, userController.resetPassword)

userRouter.get('/verify-email', rateLimiting('verify-email', 30, 5), userController.verifyEmail)
userRouter.patch('/verify-reset-password', rateLimiting('verify-reset-password', 30, 5), userController.verifyResetPassword)

export default userRouter
