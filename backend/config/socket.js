import { Server } from "socket.io"
import cookie from 'cookie';
import jwt from 'jsonwebtoken'
import { addUserScoreByUsername, getMyData } from "../model/user-model.js";
import { getRandomQuizData } from "../model/data-model.js";
import * as redisHelper from "../utils/redis-helper.js";

export function setupSocket(server) {
  const io = new Server(server)

  

  // server-side events
  io.on("connection", async (socket) => {
    const cookies = socket.request.headers.cookie || ''
    const parsed = cookie.parse(cookies)
    
    if(!parsed.accessToken){
      if(!parsed.refreshToken){return socket.disconnect(true)}
      return socket.emit("reject", "access token invalid")
    }
    const decoded = jwt.verify(parsed.accessToken, process.env.JWT_SECRETKEY)
    const user = await getMyData({id: decoded.id})
    socket.user = user.username
    
    socket.on("request_question", async ()=>{
      let newQuestion = null
      const {ok, data} = await redisHelper.get("quiz", socket.user)
      if(!ok){
        const [questions, answers] = await getQuestions()
        const payload = {
          questions,
          answers,
          index: 0,
          streak: 0
        }
        const {ok2} = await redisHelper.set("quiz", socket.user, payload)
        newQuestion = payload.questions[0]
        if(!ok2){return socket.disconnect(true)}
      }
      else{
        newQuestion = data.questions[data.index]
        if(!newQuestion){
          const [questions, answers] = await getQuestions()
          data.questions = questions
          data.answers = answers
          data.index = 0
          newQuestion = data.questions[0]
        }
      }

      socket.emit("new_question", newQuestion)
    })

    socket.on("submit_answer", async (answer)=>{
      const {ok, data} = await redisHelper.get("quiz", socket.user)
      if(!ok){return socket.disconnect(true)}

      const correctAnswer = data.answers[data.index]
      if(!correctAnswer){return socket.disconnect(true)}
      const isCorrect = correctAnswer === answer
      if(!isCorrect){data.streak = 0}
      else{data.streak++}

      const payload = {correct: isCorrect, correctAnswer, streak: data.streak}
      if(isCorrect){
        let increment = 10
        if(data.streak > 9){increment = 50}
        else if(data.streak > 4){increment = 25}
        else if(data.streak > 2){increment = 15}
        payload.points_added = increment
        const affectedRows = await addUserScoreByUsername({username: socket.user, increment})
        if(!affectedRows){return socket.disconnect(true)}
      }

      data.index++
      if(!data.questions[data.index]){
        const [questions, answers] = await getQuestions()
        data.questions = questions
        data.answers = answers
        data.index = 0
      }
      const {ok: ok2} = await redisHelper.set("quiz", socket.user, data)
      if(!ok2){return socket.disconnect(true)}

      socket.emit("answer_result", payload)
    })
  })
}

async function getQuestions() {
  const {randomData, randomMeaning} = await getRandomQuizData()
  let questions = []
  let answers = []
  randomData.forEach(data => {
      const choices = randomMeaning.splice(0,4)
      const randomIndex = Math.floor(Math.random() * 5)
      choices.splice(randomIndex, 0, data.meaning)

      questions.push({
          vocab: data.vocab,
          choices
      })
      answers.push(data.meaning)
  })
  return [questions, answers]
}

