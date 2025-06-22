import express from 'express'
import profileController from '../controller/profile.js'
import verifyJwt from '../middleware/jwtVerify.js'

const profileRouter = express.Router()
profileRouter.use('/', (req, res, next)=>{
    console.log("profile endpoint hit")
    next()
})

profileRouter.post('/get', verifyJwt, profileController.getData)
profileRouter.put('/changeData', verifyJwt, profileController.changeUserData)

export default profileRouter