import redis from "../config/redis.js"

const project = process.env.PROJECT_NAME || 'vocab'

const redisType = {
    "cache": {prefix: `${project}:cache:`, ttl: 30},
    "tokens": {prefix: `${project}:tokens:`, ttl: 60 * 60 * 168},
    "quiz": {prefix: `${project}:quiz:`, ttl: 60 * 15},
    "questions": {prefix: `${project}:questions:`, ttl: 60 * 15},
    "socket": {prefix: `${project}:socket:`, ttl: 60 * 15},
    "lock": {prefix: `${project}:lock:`, ttl: 5},
    "update-email": {prefix: `${project}:update-email:`, ttl: 60 * 30},
    "reset-password": {prefix: `${project}:reset-password:`, ttl: 60 * 5}
}

export async function isLocked(type, key){
    try {
        const gotLock = await redis.set(`${redisType.lock.prefix}${type}:${key}`, "1", { NX: true, EX: redisType.lock.ttl }) // 5 detik lock
        return gotLock === null
    } catch(err){
        console.error("Redis SET error:", err.message)
        return true
    }
}

export async function releaseLock(type, key) {
    try {
        await redis.del(`${redisType.lock.prefix}${type}:${key}`)
        return true
    } catch (err) {
        console.error("Redis DEL error:", err.message)
        return false
    }
}

export function redisKey(type, key){
    return `${redisType[type].prefix}${key}`
}

export function getTTL(type){
    return redisType[type].ttl
}

export async function get(type, key){
    try {
        const rawData = await redis.get(redisKey(type, key))
        if(!rawData){return {ok: false}}
        return {ok: true, data: JSON.parse(rawData)}
    } catch(err) {
        console.error("Redis GET error:", err.message)
        return {ok: false} 
    }
}

export async function set(type, key, data){
    try {
        await redis.set(redisKey(type, key), JSON.stringify(data), {EX: getTTL(type)})
        return {ok: true} 
    } catch (err) {
        console.error("Redis SET error:", err.message)
        return {ok: false}
    }
}

export async function del(type, key){
    try {
        await redis.del(redisKey(type, key))
        return {ok: true} 
    } catch (err) {
        console.error("Redis DEL error:", err.message)
        return {ok: false}
    }
}