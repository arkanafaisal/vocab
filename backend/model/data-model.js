import db from "../config/db.js"



export async function insertData({datas}) {
    try {
        const flatValues = datas.map(data => [data.vocab, data.meaning]).flat();
        const [{affectedRows}] = await db.query(`INSERT INTO data (vocab, meaning) VALUES ${datas.map(()=>'(?,?)').join(', ')}`, flatValues)
        return affectedRows
    } catch(err) {
        if(err.code === "ER_DUP_ENTRY"){throw new Error(err.message)}
        throw err
    }
}

export async function deleteData({datas}) {
    try {
        const [{affectedRows}] = await db.query(`DELETE FROM data WHERE vocab IN (${datas.map(() => '?').join(',')})`, datas)
        return affectedRows
    } catch(err) {
        throw err
    }
}

export async function getRandomQuizData() {
    try {
        const [randomData] = await db.query("SELECT vocab, meaning FROM data ORDER BY RAND() LIMIT 15")
        const [randomMeaning] = await db.query("SELECT meaning FROM data ORDER BY RAND() LIMIT 60")
        let randomMeaning2 = randomMeaning.map(item => item.meaning)
        return {randomData, randomMeaning: randomMeaning2}
    } catch (err) {
        throw err
    }
}