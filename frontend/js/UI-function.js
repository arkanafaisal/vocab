function changeClass(element, removed, added){
    element.classList.remove(...removed)
    element.classList.add(...added)
}

function switchContent(event, index){
    let selected = Array.from(document.getElementsByClassName('selected'))
    if(typeof index === "number"){
        changeClass(selected[0], ["selected", "text-white"], [])
        changeClass(selected[1], ["selected"], ["hidden"])

        changeClass(navbar[index], [], ["selected", "text-white"])
        changeClass(sections[index], ["hidden"], ["selected"])
    } else {
        navbar.forEach((val, index) => {
            if(event.target == val){
                changeClass(selected[0], ["selected", "text-white"], [])
                changeClass(selected[1], ["selected"], ["hidden"])

                event.target.classList.add('selected', 'text-white')
                changeClass(sections[index], ["hidden"], ["selected"])
            }
        })
    }
}

async function logout(){
    const response = await startFetching("auth/logout", "DELETE")
    if(!response.success){return alert("logout gagal, coba lagi")}

    window.location.href = "./login.html"
}