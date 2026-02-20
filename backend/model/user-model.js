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
    const [[user]] = await db.query(`SELECT id, username, email, password, score, streak FROM users WHERE ${type} = ?`, [identifier])
    if(!user){return null}

    const matchPassword = await bcrypt.compare(password, user.password)
    if(!matchPassword){return null}

    const {oassword, ...safeUser} = user

    return safeUser
}

export async function verifyUserById({id}) {
    const [[isExist]] = await db.query('SELECT 1 FROM users WHERE id = ?', [id])

    return isExist
}

// export async function addUserScore({id, increment}) {
//     const [{changedRows}] = await db.query(`UPDATE users SET score = score + ${increment} WHERE id = ?`, [id])

//     return changedRows
// }
// export async function addUserScoreByUsername({username, increment}) {
//     const [{changedRows}] = await db.query(`UPDATE users SET score = score + ? WHERE username = ?`, [increment, username])

//     return changedRows
// }

export async function getAllUsers() {
    const [users] = await db.query('SELECT username, score, streak FROM users ORDER BY score DESC')

    return users
}


export async function getMyData({id}) {
    const [[user]] = await db.query('SELECT username, email, score, streak FROM users WHERE id = ?', [id])
    return user
}

// export async function setStreakByUsername({username, streak}) {
//     const [{affectedRows}] = await db.query('UPDATE users SET streak = ? WHERE username = ?', [streak, username])
// }

export async function updateUser({username, increment, streak}) {
    const [{changedRows}] = await db.query(`UPDATE users SET score = score + ?, streak = ? WHERE username = ?`, [increment, streak, username])
    return changedRows
}

export async function getUserForUsernameChange({id}) {
    const [[user]] = await db.query("SELECT username, password FROM users WHERE id = ?", [id])
    return user
}

export async function setUsername({id, username}) {
    try {
        const [{changedRows}] = await db.query("UPDATE users SET username = ? WHERE id = ?", [username, id])
        return changedRows
    }catch(err) {
        if (err.code === 'ER_DUP_ENTRY') throw new Error('duplicate')
        throw err
    }
}


export async function getUserForEmailChange({id}) {
    const [[user]] = await db.query("SELECT email, password FROM users where id = ?", [id])
    return user
}

export async function setEmail({id, email}) {
    try {
        const [{changedRows}] = await db.query("UPDATE users SET email = ? WHERE id = ?", [email, id])
        return changedRows
    }catch(error){
        if (err.code === 'ER_DUP_ENTRY') throw new Error('duplicate')
        throw err
    }
}

export async function checkEmail({email}) {
    const [[isExist]] = await db.query("SELECT 1 FROM users WHERE email = ?", [email])
    return isExist
}

export async function getEmailForResetPassword({id}) {
   const [[{email}]] = await db.query("SELECT email FROM users WHERE id = ?", [id])
   return email
}

export async function setPassword({id, password}) {
    const hashedPassword = await bcrypt.hash(password, 10)
    const [{changedRows}] = await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id])
    return changedRows
}