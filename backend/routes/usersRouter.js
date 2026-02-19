import express from 'express'

import verifyJwt from '../middleware/jwtVerify.js'
import rateLimiting from '../middleware/rateLimiting.js'

import userController from '../controller/user-controller.js'

const userRouter = express.Router()

userRouter.get('/',    rateLimiting("getAllUsers", 1, 90),     userController.getAllUsers)
userRouter.get('/me',  rateLimiting('getMyProfile', 1, 120),   verifyJwt, userController.getMyData)

userRouter.patch('/update-username', rateLimiting('update-username', 15, 10), verifyJwt, userController.updateUsername)
userRouter.patch('/update-email', rateLimiting('update-email', 30, 5), verifyJwt, userController.updateEmail)
userRouter.patch('/reset-password', rateLimiting('reset-password', 60, 10), verifyJwt, userController.resetPassword)

userRouter.get('/verify-email', rateLimiting('verify-email', 60, 20), userController.verifyEmail)
userRouter.patch('/verify-reset-password', rateLimiting('reset-password', 60, 5), userController.verifyResetPassword)

export default userRouter