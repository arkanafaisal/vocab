const navbar = Array.from(document.getElementById('navbar').children)
const sections = Array.from(document.querySelector('main').children)

/////////////////////////////////////////////
const signOptions = document.getElementById("sign-options")
const logOutBtn = document.getElementById("logout-btn")



/////////////////////////////////////////////
const leaderboardContainer = document.getElementById("leaderboard-container")

let isOnCooldown = false




/////////////////////////////////////////////
const warningText = document.getElementById("warning-text")
const scoreNumber = document.getElementById('scoreNumber')

let answered
let stopUpdating = false
let questions = []
let batchId = ""

mainFunction()
async function mainFunction(){
    await setUserData(1)
    await setLeaderboard()
    await setDataByLocalstorage()
}














































async function setLeaderboard() {
    if(isOnCooldown){return}
    isOnCooldown = true
    
    const refreshLeaderboardBtn = document.getElementById("refresh-leaderboard-btn")
    changeClass(refreshLeaderboardBtn, ["bg-green-500"], ["bg-red-500"])
    
    const result = await startFetching("users/", "GET")
    setTimeout(()=>{
        isOnCooldown = false
        changeClass(refreshLeaderboardBtn, ["bg-red-500"], ["bg-green-500"])
    }, 3000)
    
    if(!result.success){return}

    let allUSers = result.data
    allUSers.sort((a,b)=>b.score - a.score)
    
    const userNode = document.getElementById("user-leaderboard-node").content.firstElementChild
    const fragment = document.createDocumentFragment()
    for(let i = 0; i< allUSers.length; i++){
        let duplicate = userNode.cloneNode(true)
        duplicate.classList.remove("hidden")

        let list = duplicate.children[0].children
        list[0].innerText = i+1 
        list[1].innerText = allUSers[i].username
        list[2].innerText = allUSers[i].score

        if(allUSers[i].username === leaderboardContainer.dataset.username){
            changeClass(duplicate, ["bg-white"], ["bg-blue-300"])
        }

        fragment.appendChild(duplicate)
    }
    leaderboardContainer.replaceChildren([])
    leaderboardContainer.appendChild(fragment)
}

async function setUserData(attempt = 1) {
    if(attempt > 3){return alert('error')}
    const result = await startFetching('users/me', 'GET')
    if(result.code && result.code === 429){return}
    if(!result.success){
        showWarningText(result.message, true)
        
        setUserData(attempt + 1)
        return
    }
    showWarningText(result.message)

    document.getElementById('login-button').classList.add('hidden')
    document.getElementById('logout-button').classList.remove('hidden')
    scoreNumber.innerText = result.data.score
    leaderboardContainer.dataset.username = result.data.username   
    return
}

async function refreshData(attempt = 1) {
    
    showWarningText('fetching new questions..')
    const result = await startFetching('data/get/', 'GET')
    if(result.code && result.code === 429){return}
    if(!result.success && attempt <=3){
        showWarningText(res.message, true)
        refreshData(attempt+1)
        return
    }

    if(result.data[1].length === 0) {return showWarningText("server error", true)}

    batchId = result.data.batchId
    questions = result.data.questions
    localStorage.setItem('batchId', batchId)
    localStorage.setItem('questions', JSON.stringify(questions))

    return await refreshQuiz()
}

const answerBtn = document.querySelectorAll('.answer-button')
async function refreshQuiz() {
    if(questions.length === 0){await refreshData(1)}

    
    const vocabWord = document.getElementById('vocab-word')
    vocabWord.innerText = questions[0].vocab
    answerBtn.forEach((el, index) => {
        el.innerText = questions[0].choices[index]
    })

}

async function showAnswer(el) {
    if(answered){return}
    answered = true
    if(!batchId){
        batchId = localStorage.getItem('batchId') || 'aselole'
    }
    try {
        const userAnswer = el.innerText
        const res = await startFetching("data/answer", "POST", {batchId, answer: userAnswer})
        if(res.code && res.code === 429){return answered = false}
        if(!res.success){
            showWarningText(res.message, true)
            if(res.message === "batch expired") {
                batchId = []
                questions = []
                localStorage.removeItem('batchId')
                localStorage.removeItem('questions')
                setTimeout(()=>{refreshData(1); answered = false}, 2000)
                return
            }

            answered = false
            return
        }

        if(questions.length > 0){
            questions.shift()
            localStorage.setItem('questions', JSON.stringify(questions))
        }
        
        
        if(res.message !== "correct"){answerUI(el, false, res.data)}
        else{answerUI(el, true)}

        setTimeout(() => {
            answerBtn.forEach(el => {
                changeClass(el, ['bg-green-500', 'bg-red-500', 'bg-white'], ['bg-blue-500'])
            })
            refreshQuiz()
            answered = false
        }, 3000)
    } catch(err) {
        answered = false
    }
}

function setDataByLocalstorage(){
    batchId = localStorage.getItem('batchId')
    questions = localStorage.getItem('questions')
    if(!batchId || !questions){return refreshData(1)}
    
    questions = JSON.parse(localStorage.getItem('questions'))
    refreshQuiz()
}
    





async function logout(){
    const response = await startFetching("auth/logout", "DELETE")
    if(!response.success){return alert(res.message)}

    localStorage.removeItem('batchId')
    localStorage.removeItem('questions')
    window.location.href = "./sign.html"
}



























// UI function
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
    }
}

function changeClass(element, removed, added){
    element.classList.remove(...removed)
    element.classList.add(...added)
}

function switchToQuiz(isTrue){
    const quizNavbar = document.getElementById('quiz-navbar')
    const leaderboardNavbar = document.getElementById('leaderboard-navbar')
    const quizSection = document.getElementById('quiz-section')
    const leaderboardSection = document.getElementById('leaderboard-section')

    if(isTrue){
        leaderboardNavbar.classList.remove('text-white')
        leaderboardSection.classList.add('hidden')
        
        quizNavbar.classList.add('text-white')
        quizSection.classList.remove('hidden')
    }else{
        quizNavbar.classList.remove('text-white')
        quizSection.classList.add('hidden')
        
        leaderboardNavbar.classList.add('text-white')
        leaderboardSection.classList.remove('hidden')
    }
}

let warningTextTimeId
function showWarningText(text, isError = false){
    warningText.innerText = text
    if(isError) {
        changeClass(warningText, ['text-gray-300', 'text-blue-600'], ['text-red-600'])
        if(warningTextTimeId){clearTimeout(warningTextTimeId)}
        return
    }

    changeClass(warningText, ['text-gray-300', 'text-red-600'], ['text-blue-600'])
    warningTextTimeId = setTimeout(hideWarningText, 2000)
}

function hideWarningText(){
    changeClass(warningText, ['text-red-600', 'text-blue-600'], ['text-gray-300'])
}

function login(){
    window.location.href = 'sign.html'
}





































































////// startFetching function

async function startFetching(endpoint, method, body = null) {
    const developmentUrl = "http://127.0.0.1:3002/"
    const productionUrl = "https://vocab-server.arkanafaisal.my.id/"
    const url = productionUrl
    try {
        let options = {
            method: method,
            credentials:"include",
            headers: {
                'Content-type': 'application/json'
            }
        }
        if(body){options.body = JSON.stringify(body)}

        const response = await fetch(url + endpoint, options)
        const result = await response.json()

        if(!result.success){
            if(result.code && result.code === 429){
                showWarningText("too many request, please try again later")
                return {success:false, code:429}
            }
            if(result.message === "token expired" || result.message === "token invalid"){
                const response2 = await fetch(url + "auth/refresh", {
                    method: "POST",
                    credentials: "include",
                    headers: {'Content-type': 'application/json'}
                })
                const result2 = await response2.json()
                if(!result2.success){
                    if(result2.message === 'refresh token invalid'){
                        showWarningText('please try re-log', true)
                                        
                        document.getElementById('logout-button').classList.add('hidden')
                    }
                    return 
                }
                
                return startFetching(endpoint, method, body)
            }
        }

        return result
    } catch(error) {
        alert(error)
    }
}
    

