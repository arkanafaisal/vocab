import express from 'express'
import profileController from '../controller/profile.js'
import verifyJwt from '../middleware/jwtVerify.js'
import rateLimiting from '../middleware/rateLimiting.js'

const profileRouter = express.Router()
// profileRouter.use('/', (req, res, next)=>{
//     console.log("profile endpoint hit")
//     next()
// })

profileRouter.get('/me',            rateLimiting('getMyProfile', 1, 60),    verifyJwt, profileController.getData)

export default profileRouter