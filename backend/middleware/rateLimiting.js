import redis from "../config/redis.js"
import {response} from "../utils/response.js"

export default function rateLimiting(feature, windowM, limit){
    return async function(req, res, next){
        const key = "vocab:rl:" + feature + ":" + req.ip
        

        const windowMs = windowM * 60000

        const count = await redis.eval(
            `
            local current = redis.call("INCR", KEYS[1])
            if current == 1 then
                redis.call("PEXPIRE", KEYS[1], ARGV[1])
            end
            return current
            `,
            {
                keys: [key],
                arguments: [windowMs.toString()]
            }
        )
        
        if (count > limit) {
        return response(res, false, "too many requests", null, 429)
        }

        next()


        // const count = await redis.incr(key)
        // if (count === 1) {await redis.pExpire(key, (windowM * 60000))}
        // if (count > limit) {return response(res, false, "limit tercapai, coba lagi nanti", null, 429)}
    }
}