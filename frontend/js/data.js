function setMyProfile(username, email, score){
    myProfileBtn.classList.add("hidden")
    signOptions.classList.remove("hidden")

    if(!username || !email){
        return
    }

    profileUsername.innerHTML = username
    profileEmail.innerHTML = email
    profileScore.innerHTML = score || 0

    signOptions.classList.add("hidden")
    logOutBtn.classList.remove("hidden")
}