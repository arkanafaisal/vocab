const navbar = Array.from(document.getElementById('navbar').children)
const sections = Array.from(document.querySelector('main').children)

/////////////////////////////////////////////
const profileUsername = document.getElementById("profile-username")
const profileEmail = document.getElementById("profile-email")
const profileScore = document.getElementById("profile-score")
const myProfileBtn = document.getElementById("my-profile-btn")
const signOptions = document.getElementById("sign-options")
const logOutBtn = document.getElementById("logout-btn")



/////////////////////////////////////////////
const leaderboardContainer = document.getElementById("leaderboard-container")
const userNode = document.getElementById("user-node")
const refreshLeaderboardBtn = document.getElementById("refresh-leaderboard-btn")
let isOnCooldown = false




/////////////////////////////////////////////
const vocabWord = document.getElementById('vocab-word')
const warningText = document.getElementById("warning-text")
const scoreNumber = document.getElementById('scoreNumber')

let answered
let stopUpdating = false

mainFunction()
async function mainFunction(){
    await getScore()
    await setLeaderboard()
    await setDataByLocalstorage()
}














































async function setLeaderboard() {
    if(isOnCooldown){return}
    changeClass(refreshLeaderboardBtn, ["bg-green-500"], ["bg-red-500"])
    setTimeout(()=>{
        isOnCooldown = false
        changeClass(refreshLeaderboardBtn, ["bg-red-500"], ["bg-green-500"])
    }, 3000)
    const result = await startFetching("users/", "GET", null, null)
    if(!result.success){
        return
    }

    let allUSers = result.data
    allUSers.sort((a,b)=>b.score - a.score)
    leaderboardContainer.replaceChildren([])

    for(let i = 0; i< allUSers.length; i++){
        let duplicate = userNode.cloneNode(true)
        duplicate.classList.remove("hidden")
        duplicate.id = allUSers[i]._id

        let list = duplicate.children[0].children
        list[0].innerText = i+1 
        list[1].innerText = allUSers[i].username
        list[2].innerText = allUSers[i].score

        if(allUSers[i].username === profileUsername.innerText){
            changeClass(duplicate, ["bg-white"], ["bg-blue-300"])
        }

        leaderboardContainer.appendChild(duplicate)
    }
}


async function getScore() {
    const result = await startFetching('profile/get', 'POST')
    
    warningText.innerText = result.message
    changeClass(warningText, ["text-red-600", "text-gray-300"], ["text-blue-600"])
    
    if(!result.success){
        changeClass(warningText, ["text-blue-600", "text-gray-300"], ["text-red-600"])
        localStorage.setItem("score", 0)
        scoreNumber.innerText = 0
        
        if(result.message === "token expired"){
            const result2 = await startFetching("auth/refresh", "POST")
            if(!result2.success){
                setTimeout(getScore, 5000)
                return
            }
            getScore()
            return
        }
        return
    }
    
    localStorage.setItem("score", result.data.score)
    scoreNumber.innerText = result.data.score

    setLeaderboard()
    
    setMyProfile(result.data.username, result.data.email, result.data.score)

    setTimeout(()=>{
        changeClass(warningText, ["text-red-600", "text-blue-600"], ["text-gray-300"])
    }, 3000)    
    return
}

let questions = []
let batchId = ""
async function refreshData(attempt) {
    if(questions.length > 0){return true}
    
    const result = await startFetching('data/get/', 'GET')
    if(!result.success && attempt <=3){
        return refreshData(attempt+1)
    } else {
        batchId = result.data[0]
        questions = result.data[1]
        localStorage.setItem('batchId', batchId)
        localStorage.setItem('questions', JSON.stringify(questions))

        return await refreshQuiz()
    }
}

async function setDataByLocalstorage(){
    batchId = localStorage.getItem('batchId')
    if(!batchId){return await refreshQuiz()}

    questions = JSON.parse(localStorage.getItem('questions'))
    await refreshQuiz()
}

const answerBtn = document.querySelectorAll('.answer-button')
async function refreshQuiz() {
    if(questions.length === 0){await refreshData(1)}

    vocabWord.innerText = questions[0].vocab
    answerBtn.forEach((el, index) => {
        el.innerText = questions[0].choices[index]
    })

}

async function showAnswer(el) {
    if(answered || questions.length === 0){return}
    answered = true
    try {
        const userAnswer = el.innerText
        const res = await startFetching("data/answer", "POST", {batchId, answer: userAnswer})
        if(!res.success){
            if(res.message === "batch expired") {
                batchId = []
                localStorage.removeItem('batchId')
                await refreshData(1)
            }
            answered = false
            return
        }

        questions.shift()
        localStorage.setItem('questions', JSON.stringify(questions))
        
        if(res.message !== "correct"){return await answerUI(el, false, res.data)}
        await answerUI(el, true)
    } catch(err) {
        console.log(err)
        alert(556)
        answered = false
    }
}

function answerUI(userAnswerEl, isCorrect, correctAnswer = ""){
    answerBtn.forEach(el => {
        changeClass(el, ['bg-blue-500'], ["bg-white"])
        if(isCorrect){
            changeClass(userAnswerEl, ['bg-blue-500', 'bg-white'], ['bg-green-500'])
        } else {
            changeClass(userAnswerEl, ['bg-blue-500', 'bg-white'], ['bg-red-500'])
            if(el.innerText === correctAnswer){
                changeClass(el, ['bg-blue-500', 'bg-white'], ['bg-green-500'])
            }
        }
    })

    if(isCorrect){
        scoreNumber.innerText = parseInt(scoreNumber.innerText) + 1
        profileScore.innerText = scoreNumber.innerText
    }

    setTimeout(() => {
        answerBtn.forEach(el => {
            changeClass(el, ['bg-green-500', 'bg-red-500', 'bg-white'], ['bg-blue-500'])
        })
        refreshQuiz()
        answered = false
    }, 3000)
}