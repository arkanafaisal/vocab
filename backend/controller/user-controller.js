
import { response } from '../utils/response.js'
import * as redisHelper from '../utils/redis-helper.js'
import * as UserModel from '../model/user-model.js'

const userController = {}

userController.getAllUsers = async (req, res) => {
    try {
        const {ok, data} = await redisHelper.get('cache', 'allUserData')
        if(ok){return response(res, true, "retrieved all users", data)}

        const allUsers = await UserModel.getAllUsers()
        await redisHelper.set('cache', 'allUserData', allUsers)
    
        return response(res, true, "retrieved all users", allUsers)
    } catch(err) {
        console.log(err)
        return response(res, false, "server error", null, 500)
    }
}
userController.getMyData = async (req, res) => {
    try {
        const {ok, data} = await redisHelper.get('cache', `userData:${req.user.id}`)
        if(ok){return response(res, true, 'retrieved your profile', data)}
        
        const user = await UserModel.getMyData({id: req.user.id})
        if(!user){return response(res, false, "user not found", null, 404)}

        await redisHelper.set('cache', `userData:${req.user.id}`, user)
        return response(res, true, 'retrieved your profile', user)
    } catch(err) {
        return response(res, false, "server error", null, 500)
    }
}
export default userController
