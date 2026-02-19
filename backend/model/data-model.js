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

export async function getRandomQuizData({num}) {
    try {
        const [randomData] = await db.query("SELECT vocab, meaning FROM data ORDER BY RAND() LIMIT ?", [num])
        const [randomMeaning] = await db.query("SELECT meaning FROM data ORDER BY RAND() LIMIT ?", [num * 4])
        let randomMeaning2 = randomMeaning.map(item => item.meaning)
        let questions = []
        randomData.forEach(data => {
            const choices = randomMeaning2.splice(0,4)
            const randomIndex = Math.floor(Math.random() * 5)
            choices.splice(randomIndex, 0, data.meaning)

            questions.push({
                vocab: data.vocab,
                choices,
                answerIndex: randomIndex
            })
        })

        return questions
    } catch (err) {
        throw err
    }
}