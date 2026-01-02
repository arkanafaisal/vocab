import { getDb } from "../config/db.js"



export async function insertData({datas}) {
    try {
        const db = getDb()
        const {insertedCount} = await db.collection('datas').insertMany(datas)
        return insertedCount
    } catch(err) {
        if(err.code !== 11000){throw new Error( err.writeErrors?.[0]?.err?.errmsg || err.message || "Insert failed")}
        throw err
    }
}

export async function deleteData({datas}) {
    try {
        const db = getDb()
        const {deletedCount} = await db.collection('datas').deleteMany({$or: datas})
        return deletedCount
    } catch(err) {
        throw err
    }
}

export async function getRandomQuizData() {
    try {
        const db = getDb()
        const randomData = await db.collection('datas').aggregate([
            {$project: {_id: 0, vocab: 1, meaning: 1}},
            {$sample: {size : 5}}
        ]).toArray()
        const randomMeaning = await db.collection('datas').aggregate([
            {$project: {_id: 0, meaning: 1}},
            {$sample: {size : 5*4}}
        ]).toArray()
        let randomMeaning2 = randomMeaning.map(item => item.meaning)
        return {randomData, randomMeaning: randomMeaning2}
    } catch (err) {
        throw err
    }
}