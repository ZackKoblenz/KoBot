const client_id = "vkfu4c51hsx801w76r6fmhudt0x685"
let access_token;
let data;
let profilePicture;
let username;
let div = document.getElementById('profile_picture')
let img = document.createElement('img')
img.addEventListener('click', function(){
    location.href = "http://localhost:5500/pages/profile.html"
})

if(getCookie("accessToken")){
    access_token = getCookie("accessToken")
}
if(getCookie("profilePicture")){
    ProfilePicture()
}
if(getCookie("username")){
    username = getCookie("username")
}

if (document.location.hash && !getCookie("accessToken")) {
    console.log("location hash if statement hit")
    let parsedHash = new URLSearchParams(window.location.hash.substr(1))
    if(parsedHash.get('access_token')){
        access_token = parsedHash.get('access_token')
        console.log(access_token)
        document.cookie = `accessToken=${access_token}`
        GetChannelInfo(access_token)
        setTimeout(() => {
            ProfilePicture()
        }, 500)
        setTimeout(() => {console.log("reloading"); location.href = "http://localhost:5500"}, 750)
    }
}

//URL will need to be changed to reflect live URL
if(location.href === "http://localhost:5500/pages/profile.html"){

    GetChannels()
    JoinAndPartChannel()
    getCommands(getCookie("username"))
    let commandForm = document.getElementById("commandForm")
    commandForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let command = document.getElementById("commandname")
        let action = document.getElementById("action")
        let userlevel = document.getElementById("userlevel")
        addCommand(getCookie("username"), command.value, action.value, userlevel.value)
        setTimeout(() => {console.log("reloading"); location.href = "http://localhost:5500/pages/profile.html"}, 750)
    })
}

async function GetChannelInfo(){
    await fetch(`https://api.twitch.tv/helix/users`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Client-ID": `${client_id}`
        }
    })
    .then((response) => response.json())
    .then((json) => {
        console.log(json);
        data = json;
        profilePicture = data.data[0].profile_image_url
        username = data.data[0].login
        document.cookie = `username=${data.data[0].login}`
        passInfoToBackend(access_token, data.data[0].login)
        document.cookie = `profilePicture=${data.data[0].profile_image_url}`
    })

}


function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}    

function ProfilePicture(){
    //ProfilePictureFetch().then((response) => {document.cookie = `profilePicture=${response}`})
    profilePicture = getCookie('profilePicture')
    document.getElementById("button").remove()
    let signOut = document.getElementById('signOutButton')
    let signOutButton = document.createElement('button')
    let signOutCSS = document.createElement('a')
    signOutCSS.innerHTML = "Sign Out"
    signOut.appendChild(signOutButton).appendChild(signOutCSS)

    signOut.addEventListener("click", function() {
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = "profilePicture=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        location.href = "http://localhost:5500"
        setTimeout(() => {console.log("reloading"); location.reload()}, 5000)
    })
    img.src = profilePicture;
    div.appendChild(img).setAttribute("class", "profile_picture")
}    

async function ProfilePictureFetch(user) { 
    await fetch(`http://localhost:3000/user/${user}`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json"
    },
})
.then((response) => response.text())
.then((json) => {
    console.log(json)
    return json
})}

async function GetChannels(){
    let joinButton = document.getElementById('join')
    let partButton = document.getElementById('part') 
    await fetch('http://localhost:3000/channels', {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then((response) => response.json())
    .then((json) => {
        console.log(json)
        if(json.includes(`#${getCookie("username")}`)){
            joinButton.remove()
        }else{
            partButton.remove()
        }
    })
    .catch(error => {
        joinButton.remove()
        partButton.remove()
        let p = document.createElement('p').innerText = `<p>Unable To Reach Server</p><p>${error}</p>`
        let er = document.getElementById("error")
        er.innerHTML = p
    })
}

function JoinAndPartChannel() {
    let joinButton = document.getElementById('join')
    let partButton = document.getElementById('part')
    joinButton.addEventListener("click", async function() {

        await fetch("http://localhost:3000/join",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: `{"username": "${getCookie("username")}"}`
        })
        .then(setTimeout(() => location.reload(), 1000))
        .catch(error => {
            console.log(error)
        });
    })
    partButton.addEventListener("click", async function() {

        await fetch("http://localhost:3000/part",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: `{"username": "${getCookie("username")}"}`
        })
        .then(setTimeout(() => location.reload(), 1000))
        .catch(error => {
            console.log(error)
        });
        
    })
}

async function passInfoToBackend(access_token, login) {
    console.log(username)
    await fetch ("http://localhost:3000/auth",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: `{"code": "${access_token}", "username": "${login}", "profile_picture": "${profilePicture}"}`
    })
}

async function updateCommand(username, command, action){
    await fetch ("http://localhost:3000/commands", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: `{"username": "${username}", "command": "${command}", "action": "${action}"}`
    })
}

async function updateCommandEnabled(username, command, enabled) {
    await fetch ("http://localhost:3000/commands/update/enable", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}", "enabled": "${enabled}"}`
    })
}

async function getCommands(username){
    const myList = document.getElementById("commands")
    await fetch("http://localhost:3000/commands", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: `{"username": "${username}"}`
    }).then((res) => res.json())
    .then((json) => {console.log(json); 
        let i = 0
        let commandnames = []
        for(const commands of json){
            const divItem = document.createElement("div")
            const listItem = document.createElement("tr")
            listItem.appendChild(document.createElement("td")).innerHTML = `<button id="enable" class="enabled"><a id="Enabled${i}">Enabled</a></button>${commands.command_name}`
            listItem.appendChild(document.createElement("td")).innerHTML = `${commands.action}<button id="delete" class="delete"><a>Delete</a></button>`
            myList.appendChild(listItem)
            //Delete Button Logic
            const del = document.getElementsByClassName("delete")
            console.log(del)
            del[i].addEventListener("click", () => {
                delCommand(getCookie("username"),commands.command_name)
                setTimeout(() => {console.log("reloading"); location.href = "http://localhost:5500/pages/profile.html"}, 750)
            })
            //Enabled Button Toggle
            const enabled = document.getElementsByClassName("enabled")
            const enable = document.getElementById(`Enabled${i}`)
            console.log(enabled)
            let isToggled = false;
            if(commands.enabled === 1){
                isToggled = true
                
            }else {
                enable.innerText = "Disabled"
            }
            
            enabled[i].addEventListener("click", () => {
                
                if(isToggled){
                    updateCommandEnabled(getCookie("username"), commands.command_name, 0);
                    enable.innerText = "Disabled"
                }
                else{
                    updateCommandEnabled(getCookie("username"), commands.command_name, 1);
                    enable.innerText = "Enabled"
                    
                }
                isToggled = !isToggled;
                
                
            })
            i++
        }

    })
}

async function addCommand(username, command, action, userlevel){
    console.log("add command")
    await fetch('http://localhost:3000/commands/add', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}", "action": "${action}", "userlevel": "${userlevel}"}`
    })
}

 async function delCommand(username, command){
    // console.log("delete command")
    await fetch('http://localhost:3000/commands/', {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}"}`
    })
 }

 function search(){
    let input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("search")
    filter = input.value.toUpperCase()
    table = document.getElementById("commands")
    tr = table.getElementsByTagName("tr")

    for (i = 0; i< tr.length; i++){
        td = tr[i].getElementsByTagName("td")[0]
        if (td) {
            txtValue = td.textContent || td.innerText;
            if(txtValue.toUpperCase().indexOf(filter) > - 1) {
                tr[i].style.display = ""
            }else {
                tr[i].style.display = "none"
            }
        }
    }
 }