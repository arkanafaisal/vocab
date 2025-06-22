import { getDb } from '../db.js'
import { response } from '../response.js'

const dataController = {}

dataController.insertData = async (req, res) => {
    console.log('insert endpoint hit')
    const { data_access_token } = req.body
    if(data_access_token !== process.env.DATA_ACCESS_TOKEN){return response(403, false, "akses tidak diizinkan", null, res)}

    const db = getDb()
    try {
        const result = await db.collection('datas').insertMany(req.body.datas)
            console.log(req.body.datas)
            
            return response(201, true, "data berhasil dimasukkan", result, res)
    } catch(error) {
        if(error) {return response(500, false, "error when inserting", null, res)}
    }
}


dataController.deleteData = async (req, res) => {
    const { data_access_token, datas } = req.body
    if(data_access_token !== process.env.DATA_ACCESS_TOKEN){return response(403, false, "access denied", null, res)}
    let deleteQuery = {$or: datas}
    if(datas.length === 0){deleteQuery = {}}
    try {
        const db = getDb()
        
        const result = await db.collection('datas').deleteMany(deleteQuery)
        if(!result.acknowledged){return response(500, false, "error when inserting", null, res)}

        return response(201, true, "successfully deleteing", result.deletedCount, res)


    } catch(error) {
        return response(500, false, "error when deleting", null, res)
    }
}


dataController.getData = async (req, res) => {
    console.log('get endpoint hit')
    let number = req.params.number
    number = parseInt(number)
    if(isNaN(number)){return response(400, false, "please fill the number param", null, res)}

    try {
        const db = getDb()
        const randomData = await db.collection('datas').aggregate([
            {$project: {_id: 0, vocab: 1, meaning: 1}},
            {$sample: {size : number}}
        ]).toArray()
        const randomMeaning = await db.collection('datas').aggregate([
            {$project: {_id: 0, meaning: 1}},
            {$sample: {size : number*5}}
        ]).toArray()
        if(!randomData || !randomMeaning){return response(500, false, "error when getting data", null, res)}
        const randomMeaningMapped = randomMeaning.map(value => {
            return value.meaning
        })
        const result = [randomData,randomMeaningMapped]
        return response(200, true, "successfully getting data", result, res)
    } catch(error) {
        console.error(error)
        return response(500, false, "error when getting data", null, res)
    }

    // for(loop=0; loop>0; loop--){
        
    // }
    


    return response(200, true, "data berhasil didapatkan", number, res)

}

export default dataController