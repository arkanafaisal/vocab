import redis from "../redis.js"
import {response} from "../response.js"

export default function rateLimiting(feature, windowM, limit){
    return async function(req, res, next){
        const key = "vocab:rl:" + feature + ":" + req.ip
        const count = await redis.incr(key)

        if (count === 1) {await redis.pExpire(key, (windowM * 60000))}

        if (count > limit) {return response(res, false, "too many requests")}

        next()
    }
}