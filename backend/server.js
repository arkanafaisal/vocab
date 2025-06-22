import 'dotenv/config';

import { MongoClient, ServerApiVersion } from 'mongodb';
import {connectDb, closeDbConnection} from  './db.js'
import { response } from './response.js'

import express from 'express';
import  authRouter from './routes/authRouter.js' 
import  usersRouter from './routes/usersRouter.js' 
import profileRouter from './routes/profileRouter.js';
import dataRouter from './routes/dataRouter.js';
import cors from 'cors'

await connectDb()

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors({
  origin: 'http://127.0.0.1:5500' , // GANTI ke frontend kamu
  credentials: true                // wajib kalau pakai cookie
}))
app.use((req,res,next)=>{
    console.log(`\n${req.method} request coming...`);
    next()
})


app.get('/check', (req, res)=>{
  return res.send(true)
})
app.use('/users', await usersRouter)
app.use('/auth', await authRouter)
app.use('/profile', await profileRouter)
app.use('/data', await dataRouter)



app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

})



process.on('SIGINT', async () => {
  await closeDbConnection()
  process.exit(0);
});
