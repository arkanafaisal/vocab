import 'dotenv/config';

import { MongoClient, ServerApiVersion } from 'mongodb';
import {connectDb, closeDbConnection, getDb} from  './db.js'
import { response } from './response.js'

import express from 'express';
import  authRouter from './routes/authRouter.js' 
import  usersRouter from './routes/usersRouter.js' 
import profileRouter from './routes/profileRouter.js';
import dataRouter from './routes/dataRouter.js';
import cors from 'cors'
import cookieParser from 'cookie-parser';

await connectDb()

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cookieParser())
app.use((err, req, res, next)=>{
  if(err instanceof SyntaxError && err.status === 400 && 'body' in err){return response(res, false, "invalid JSON format")}
  next()
})

app.use(cors({
  origin: 'https://vocab.arkanafaisal.my.id', //'http://127.0.0.1:5500',  // ganti dengan URL frontend production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // opsional, untuk batasi method
  allowedHeaders: ['Content-Type'],   // opsional, header yg diizinkan
  preflightContinue: false,
  optionsSuccessStatus: 204
}))




app.get('/check', async (req, res)=>{
  try {
    const db = getDb()
    const result3 = await db.collection('users').deleteMany({})
    const result4 = await db.collection('datas').deleteMany({})
    const result1 = await db.collection('users').createIndex({ username: 1 }, { unique: true })
    const result2 = await db.collection('datas').createIndex({ vocab: 1, meaning: 1 }, { unique: true })
    
    console.log(result1, result2, result3.deletedCount, result4.deletedCount)
    return res.send("server aktif")
  } catch (error) {
    return res.send('failed')
  }
})
app.use('/users', usersRouter)
app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use('/data', dataRouter)

app.get('/test-cookies', (req, res)=>{
  console.log(req.cookies)
})

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

})



process.on('SIGINT', async () => {
  await closeDbConnection()
  process.exit(0);
});
