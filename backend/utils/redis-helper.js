import redis from "../config/redis.js"


const redisType = {
    "cache": {prefix: 'vocab:cache:', ttl: 30},
    "tokens": {prefix: 'vocab:tokens:', ttl: 60 * 60 * 168},
    "quiz": {prefix: 'vocab:quiz:', ttl: 60 * 15}
}

export async function get(type, key){
    try {
        const rawData = await redis.get(redisType[type].prefix + key)
        if(!rawData){return {ok: false}}
        return {ok: true, data: JSON.parse(rawData)}
    } catch(err) {
        console.error("Redis GET error:", err.message)
        return {ok: false} 
    }
}

export async function set(type, key, data){
    try {
        await redis.set(redisType[type].prefix + key, JSON.stringify(data), {"EX": redisType[type].ttl})
        return {ok: true} 
    } catch (err) {
        console.error("Redis SET error:", err.message)
        return {ok: false}
    }
}

export async function del(type, key){
    try {
        await redis.del(redisType[type].prefix + key)
        return {ok: true} 
    } catch (err) {
        console.error("Redis DEL error:", err.message)
        return {ok: false}
    }
}