import db from "../config/db.js"
import bcrypt from 'bcrypt'

export async function insertUser({username, email, password}) {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    try {
        const [{insertId}] = await db.query('INSERT INTO users (username, email, password) values (?, ?, ?)', [username, email, hashedPassword])
        return insertId
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new Error('duplicate')
        throw err
    }
}

export async function authenticateUser(type, identifier, password) {
    const [[user]] = await db.query(`SELECT id, username, password, score FROM users WHERE ${type} = ?`, [identifier])
    if(!user){return null}

    const matchPassword = await bcrypt.compare(password, user.password)
    if(!matchPassword){return null}

    return {id: user.id, username: user.username, score: user.score}
}

export async function verifyUserById({id}) {
    const [[isExist]] = await db.query('SELECT 1 FROM users WHERE id = ?', [id])

    return isExist
}

export async function addUserScore({id, increment}) {
    const [{affectedRows}] = await db.query(`UPDATE users SET score = score + ${increment} WHERE id = ?`, [id])

    return affectedRows
}
export async function addUserScoreByUsername({username, increment}) {
    const [{affectedRows}] = await db.query(`UPDATE users SET score = score + ? WHERE username = ?`, [increment, username])

    return affectedRows
}

export async function getAllUsers() {
    const [users] = await db.query('SELECT username, score FROM users ORDER BY score DESC')

    return users
}


export async function getMyData({id}) {
    const [[user]] = await db.query('SELECT username, score FROM users WHERE id = ?', [id])
    return user
}