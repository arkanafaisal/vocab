import 'dotenv/config';
import express from 'express';
import http from 'http'
import cookieParser from 'cookie-parser';


const app = express();
app.use(express.json())
app.set('trust proxy', true)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

import path from 'path'
import { fileURLToPath } from "url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../react/dist")))

const PORT = process.env.PORT || (process.env.NODE_ENV === "development"? 3000 : 3002)


import { setupSocket } from "./config/socket.js"
const server = http.createServer(app)
setupSocket(server)
server.listen(PORT, ()=>{console.log(`Server is running on port ${PORT}`)})







import { response } from './utils/response.js'
app.use((err, req, res, next)=>{
  if(err instanceof SyntaxError && err.status === 400 && 'body' in err){return response(res, false, "invalid JSON format")}
  next()
})



app.get('/check', async (req, res)=>{
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  return res.send("server aktif")
})


import  authRouter from './routes/authRouter.js' 
import  userRouter from './routes/usersRouter.js'
import dataRouter from './routes/dataRouter.js';
app.use('/api/users', userRouter)
app.use('/api/auth', authRouter)
app.use('/api/data', dataRouter)

app.get('/api/test-cookies', (req, res)=>{
  console.log(req.cookies)
})


import redis from "./config/redis.js"

async function cleanup() {
  console.log("opi")
  try {
    const keys = await redis.keys("vocab:socket:*")
    console.log(keys)
    if (keys.length) await redis.del(...keys)
    await redis.quit()
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0)
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);