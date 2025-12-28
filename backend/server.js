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
import cookieParser from 'cookie-parser';

await connectDb()

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'https://vocab.arkanafaisal.my.id',  // ganti dengan URL frontend production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // opsional, untuk batasi method
  allowedHeaders: ['Content-Type'],   // opsional, header yg diizinkan
  preflightContinue: false,
  optionsSuccessStatus: 204
}))




app.get('/check', (req, res)=>{
  return res.send("server aktif")
})
app.use('/users', await usersRouter)
app.use('/auth', await authRouter)
app.use('/profile', await profileRouter)
app.use('/data', await dataRouter)

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
