import { Server } from "socket.io"
import redis from "./redis.js"
import cookie from 'cookie';
import jwt from 'jsonwebtoken'
import { updateUser, getMyData } from "../model/user-model.js";
import { getRandomQuizData } from "../model/data-model.js";
import * as redisHelper from "../utils/redis-helper.js";

export const WARN_CODE = {
  RATE_LOCKED: 1001, //stop, no retry

  TEMP_FAILURE: 1002, //notification, retry events

  UNAUTHORIZED: 1003, // notification, retry connect
  QUIZ_OUT_OF_SYNC: 1003, // notification, retry connect
  SESSION_EXPIRED: 1003, // notification, retry connect

  USER_NOT_FOUND: 1004, // modal, refresh web btn
  SERVER_ERROR: 1004, // modal, refresh web btn 
  
  ACCOUNT_CONFLICT: 1005, //stop retry connect, force logout force login
}


const totalQuestion = 50




let io = null
export function setupSocket(server) {
  io = new Server(server)

  io.on("connection", async (socket) => {
    const cookies = socket.request.headers.cookie || ''
    const parsed = cookie.parse(cookies)
    if(!parsed.accessToken){return socketDC(socket, WARN_CODE.UNAUTHORIZED, "tunggu sebentar...")}
    
    try {
      const {id} = jwt.verify(parsed.accessToken, process.env.JWT_SECRETKEY)
      const user = await getMyData({id})
      
      if(!user){return socketDC(socket, WARN_CODE.USER_NOT_FOUND, "akun tidak ditemukan")}
      socket.user = user.username
      
      const ok = await redis.set(redisHelper.redisKey("socket", user.username), JSON.stringify(socket.id), {NX: true, EX: redisHelper.getTTL("socket")} )
      if(!ok){return socketDC(socket, WARN_CODE.ACCOUNT_CONFLICT, "ada perangkat lain yang menggunakan akunmu")}
      
      const {ok: ok2, data} = await redisHelper.get("quiz", socket.user)
      if(!ok2 || data.currentIndex >= totalQuestion){
        const isSuccess = await setNewBatch(socket.user, user.streak)
        if(!isSuccess){return socketDC(socket, WARN_CODE.TEMP_FAILURE, "gagal membuat pertanyaan baru, mencoba ulang...")}
      }
    } catch(err) {
      console.log(err)
      return socketDC(socket, WARN_CODE.SERVER_ERROR, "server error, tolong coba lagi")
    }
    



    socket.on("request_question", async ()=>{
      if(!socket.user){return socketDC(socket, WARN_CODE.UNAUTHORIZED, "sesi habis, tolong refresh halaman")}

      const isLocked = await redisHelper.isLocked("request_question", socket.user)
      if(isLocked){return}

      try {
        const {ok, data} = await redisHelper.get("quiz", socket.user)
        if(!ok){
          return socketDC(socket, WARN_CODE.SESSION_EXPIRED, "sesi habis, membuatkan sesi baru...")
        }
  
  
        const raw = await redis.lIndex(`vocab:questions:${socket.user}`, data.currentIndex)
        let newQuestion = raw? JSON.parse(raw) : null
        if(!newQuestion){
          const firstQuestion = await setNewBatch(socket.user, data.streak)
          if(!firstQuestion){return socketDC(socket, WARN_CODE.TEMP_FAILURE,  "gagal membuat pertanyaan baru, mencoba ulang...")}
  
          socket.emit("new_question", firstQuestion)
        } else {
          const {answerIndex, ...safeQuestion} = newQuestion
          socket.emit("new_question", safeQuestion)

        }
        
      } catch(err) {
        console.log(err)
        return socketDC(socket, WARN_CODE.SERVER_ERROR, "server error, harap hubungi admin")
      } finally {await redisHelper.releaseLock("request_question", socket.user)}

    })

    socket.on("submit_answer", async (answer)=>{
    if(!socket.user){return socketDC(socket, WARN_CODE.UNAUTHORIZED, "sesi habis, tolong refresh halaman")}

      const isLocked = await redisHelper.isLocked("submit_answer", socket.user)
      if(isLocked){return}

      try {
        const {ok, data} = await redisHelper.get("quiz", socket.user)
        if(!ok){return socketDC(socket, WARN_CODE.SESSION_EXPIRED, "sesi habis, membuatkan sesi baru...")}
        
        if(data.currentIndex >= totalQuestion){return socketDC(socket, WARN_CODE.QUIZ_OUT_OF_SYNC, "pertanyaan tidak sinkron, membuatkan pertanyaan baru...")}
        const raw = await redis.lIndex(`vocab:questions:${socket.user}`, data.currentIndex)
        const question = raw? JSON.parse(raw) : null

        const correctAnswer = question.choices[question.answerIndex]
        const isCorrect = correctAnswer === answer

        let increment = 0
        if(isCorrect){
          data.streak++
          increment = 10
          if(data.streak > 9){increment = 50}
          else if(data.streak > 4){increment = 25}
          else if(data.streak > 2){increment = 15}
        } else {data.streak = 0}

        const response = {correct: isCorrect, correctAnswer, streak: data.streak, points_added: increment}

        
        
        const changedRows = await updateUser({username: socket.user, increment, streak: data.streak})
        if(!changedRows){return socketDC(socket, WARN_CODE.USER_NOT_FOUND, "akun tidak ditemukan")}

        const broadcastResponse = {username: socket.user, score: increment, streak: data.streak}
        socket.broadcast.emit("leaderboard-update", broadcastResponse)

        data.currentIndex++
        const {ok:ok2} = await redisHelper.set("quiz", socket.user, data)
        if(!ok2){return socketDC(socket, WARN_CODE.QUIZ_OUT_OF_SYNC, "gagal menyimpan data baru")}
  
        socket.emit("answer_result", response)
        
      } catch(err) {
        console.log(err)
        return socketDC(socket, WARN_CODE.SERVER_ERROR, "server error, harap hubungi admin")
      } finally {await redisHelper.releaseLock("submit_answer", socket.user)}

    })

    socket.on("disconnect", async ()=>{
      if(!socket.user){return}
      
      const {ok, data} = await redisHelper.get("socket", socket.user)
      if(ok && data === socket.id) {
        await redisHelper.del("socket", socket.user)
      }
      
      await redisHelper.del("quiz", socket.user)
      await redisHelper.del("questions", socket.user)
    })
  })
}

export async function forceDisconnect(socketId){
  if(!io){return false}

  const socket = io.sockets.sockets.get(socketId)
  if(!socket) return false

  socketDC(socket, WARN_CODE.ACCOUNT_CONFLICT, "ada perangkat lain yang menggunakan akunmu")
  return true
}



function socketDC(socket, code, message){
  let called = false

  socket.emit("warn", {code, message}, () => {
    called = true
    if(code > 1002){socket.disconnect(true);}
  });

  
  setTimeout(() => {
    if (!called) socket.disconnect(true);
  }, 2000);
}



async function setNewBatch(username, streak) {
  await redisHelper.del("questions", username)
  const questions = await getRandomQuizData({num: totalQuestion})
  if(!questions){return null}
  const strings = questions.map(q => JSON.stringify(q))
  const isSuccess = await redis.rPush(redisHelper.redisKey("questions", username), strings)
  if(!isSuccess){return null}
  
  const quizData = {
    currentIndex: 0,
    streak
  }
  const {ok: ok2} = await redisHelper.set("quiz", username, quizData)
  if(!ok2){return null}

  const {answerIndex, ...safeQuestion} = questions[0]
  return safeQuestion
}