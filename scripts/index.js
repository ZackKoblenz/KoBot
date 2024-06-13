const client_id = "vkfu4c51hsx801w76r6fmhudt0x685"
let access_token;
let data;
let profilePicture;
let username;
const server = "https://kobot.ble.nz"
let div = document.getElementById('profile_picture')
let img = document.createElement('img')
img.addEventListener('click', function(){
    location.href = "/pages/profile.html"
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
        setTimeout(() => {console.log("reloading"); location.href = "/"}, 750)
    }
}

//URL will need to be changed to reflect live URL
if(location.pathname === "/pages/profile.html"){

    GetChannels()
    JoinAndPartChannel(getCookie("auth"))
    getCommands().then(() => {
        getWhitelist(getCookie("username"))
    })
    

    let commandForm = document.getElementById("commandForm")
    commandForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let command = document.getElementById("commandname")
        let action = document.getElementById("action")
        let userlevel = document.getElementById("userlevel")
        addCommand(getCookie("username"),`${command.value}`, action.value, userlevel.value)
        setTimeout(() => {console.log("reloading"); location.href = "/pages/profile.html"}, 750)
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
        console.log(access_token)
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
        location.href = "/"
        setTimeout(() => {console.log("reloading"); location.reload()}, 5000)
    })
    //JoinChannelOnLogin()
    img.src = profilePicture;
    div.appendChild(img).setAttribute("class", "profile_picture")
}    

async function ProfilePictureFetch(user) { 
    await fetch(`${server}/user/${user}`, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${getCookie('auth')}`,
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
    let userid = await fetch(`${server}/userid`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json"
        },
        body: `{"jwt": "${getCookie("auth")}"}`
    })
    .then((res) => {
        console.log(res)
        if(res.status === 403){
            joinButton.remove()
            partButton.remove()
            let p = document.createElement('p').innerText = `<p>Your Login Session is Currently Invalid. Please Sign out and Sign back in!</p>`
            let er = document.getElementById("error")
            er.innerHTML = p
        }
        else{
            return res.json()
        }
        
    })
    .catch((error) => {
        joinButton.remove()
        partButton.remove()
        console.log(error)
        let p = document.createElement('p').innerText = `<p>Unable To Reach Server. This page likely wont work until someone fixes the backend.. Sorry!</p><!--<p>${error}</p>-->`
        let er = document.getElementById("error")
        er.innerHTML = p
        
    })
//    console.log(userid)

    await fetch(`${server}/channels`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json"
        },
    })
    .then((response) => response.json())
    .then((json) => {
        //console.log(json)
        let bool = [];
        for(let i = 0; i < json.length; i++){
            //console.log(json[i].user_id)
            if(json[i].user_id === userid){
                bool.push("true")
            }else{
                bool.push("false")
            }
        }
        if(bool.includes("true")){

            joinButton.remove()
            //joinChannel()
        }else{ 
            partButton.remove()
            //partChannel()
        }
    })
    .catch(err => console.error("unable to reach server - getChannels"))
    
}

async function JoinChannelOnLogin(){ 
    let userid = await fetch(`${server}/userid`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json"
        },
        body: `{"jwt": "${getCookie("auth")}"}`
    })
    .then((res) => {
        return res.json()
    })
    .catch((error) => {
        console.log(error)
    })
   console.log(userid)

    await fetch(`${server}/channels`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json"
        },
    })
    .then((response) => response.json())
    .then((json) => {
        console.log(json)
        let bool = [];
        for(let i = 0; i < json.length; i++){
            //console.log(json[i].user_id)
            if(json[i].user_id === userid){
                bool.push("true")
            }else{
                bool.push("false")
            }
        }
        if(bool.includes("true")){
            
            joinChannel(getCookie("auth"))
        }else{ 
            partChannel(getCookie("auth"))
        }
    })
    
}

async function joinChannel(){
    console.log(getCookie("auth"))
    await fetch(`${server}/join`,{
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie("auth")}`,
            "Content-Type": "application/json"
            
        },
        body: `{"username": "${getCookie("username")}", "jwt": "${getCookie("auth")}"}`
    })
    .catch(error => {
        console.log(error)
    });
}

async function partChannel(){
    await fetch(`${server}/part`,{
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie("auth")}`,
            "Content-Type": "application/json"
        },
        body: `{"username": "${getCookie("username")}", "jwt": "${getCookie("auth")}"}`
    })
    .catch(error => {
        console.log(error)
    });
}

function JoinAndPartChannel() {
    let joinButton = document.getElementById('join')
    let partButton = document.getElementById('part')
    joinButton.addEventListener("click", async function() {

        joinChannel()
        .then(setTimeout(() => location.reload(), 1000))
        .catch(error => {
            console.log(error)
        });
    })
    partButton.addEventListener("click", async function() {

        partChannel()
        .then(setTimeout(() => location.reload(), 1000))
        .catch(error => {
            console.log(error)
        });
        
    })
}

async function passInfoToBackend(access_token, login) {
    console.log(username)
    await fetch (`${server}/auth`,{
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json",
        },
        body: `{"code": "${access_token}", "username": "${login}", "profile_picture": "${profilePicture}"}`
    }).then(res => res.json())
    .then(json => {
        //console.log(json)
        document.cookie = `auth=${json.accessToken}`
        console.log(getCookie("auth"))
        document.cookie = `refresh=${json.refreshToken}`
        //console.log(getCookie("auth"))
    })

    
}

async function updateCommand(username, command, action, userlevel, enabled){
    await fetch (`${server}/commands/update/all`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json",
        },
        body: `{"username": "${username}", "command": "${command}", "action": "${action}", "userlevel": "${userlevel}", "enabled":"${enabled}"}`
    })
}

async function updateCommandEnabled(username, command, enabled) {
    await fetch (`${server}/commands/update/enable`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}", "enabled": "${enabled}"}`
    })
}

async function getCommands(){
    const myList = document.getElementById("commands")
    await fetch(`${server}/commands`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json",
        },
        body: `{"jwt": "${getCookie('auth')}"}`
    }).then((res) => res.json())
    .then((json) => {
        console.log(json); 
        let i = 0
        let commandnames = []
        for(const commands of json){
            if(i < 3){
                const divItem = document.createElement("div")
                const listItem = document.createElement("tr")
                listItem.appendChild(document.createElement("td"))
                .innerHTML = `<button id="enable" class="enabled"><a id="Enabled${i}">Enabled</a></button>${commands.command_name}`
                listItem.appendChild(document.createElement("td"))
                .innerHTML = 
                `<span>
                    <p type="text" value="${commands.action}" id="commandaction${i}">${commands.action}</p>
                </span>
                <div>
                    <input type="text" placeholder="Whitelist User" class="whitelist" id="whitelist${i}">
                    <button class="add">
                        <a id="add${i}">Add</a>
                    </button>
                </div>
                <div>
                    <ul id="whitelisted${commands.id}">
                    </ul>
                </div>`
                myList.appendChild(listItem)
                //Enabled Button Toggle
                const enabled = document.getElementsByClassName("enabled")
                const enable = document.getElementById(`Enabled${i}`)
                
                //console.log(enabled)
                let isEnableToggled = false;
                let isEditToggled = false;
                if(commands.enabled === 1){
                    isEnableToggled = true
                }else {
                    enable.innerText = "Disabled"
                }
            
                enabled[i].addEventListener("click", () => {
                    if(isEnableToggled){
                        updateCommandEnabled(getCookie("username"), commands.command_name, 0);
                        enable.innerText = "Disabled"
                    }
                    else{
                        updateCommandEnabled(getCookie("username"), commands.command_name, 1);
                        enable.innerText = "Enabled"
                        
                    }
                    isEnableToggled = !isEnableToggled;
                })
                const add = document.getElementsByClassName("add")
                const whitelist = document.getElementById(`whitelist${i}`)
                const delWhitelist = document.getElementById(`whitelisted${i}`)
                add[i].addEventListener("click", () => {
                    console.log(whitelist.value)
                    addWhitelist(getCookie("username"), commands.command_name, whitelist.value.toLowerCase())
                    setTimeout(() => {
                        console.log("reloading"); 
                        location.href = "/pages/profile.html"
                    }, 750)
                })
                


            }
            else{
                const divItem = document.createElement("div")
                const listItem = document.createElement("tr")
                listItem.appendChild(document.createElement("td"))
                .innerHTML = `<button id="enable" class="enabled"><a id="Enabled${i}">Enabled</a></button>${commands.command_name}`
                listItem.appendChild(document.createElement("td"))
                .innerHTML = `<span><input type="text" value="${commands.action}" id="commandaction${i}"></span>
                <button id="delete" class="delete"><a>Delete</a></button>
                <button id="update${i}" class="update"><a>Update</a></button>
                <select name="userlevel" id="userlevel${i}">
                    <option value="everyone" id="everyone${i}">Everyone</option>
                    <option value="subscriber" id="subscriber${i}">Subscriber</option>
                    <option value="vip" id="vip${i}">VIP</option>
                    <option value="moderator" id="moderator${i}">Moderator</option>
                    <option value="broadcaster" id="broadcaster${i}">Broadcaster</option>
                </select>`
                myList.appendChild(listItem)
                //Delete Button Logic
                const del = document.getElementsByClassName("delete")
                //console.log(del)
                del[i - 3].addEventListener("click", () => {
                    delCommand(getCookie("username"),commands.command_name)
                    setTimeout(() => {
                        console.log("reloading"); 
                        location.href = "/pages/profile.html"
                    }, 750)
                })
                //Enabled Button Toggle
                const enabled = document.getElementsByClassName("enabled")
                const enable = document.getElementById(`Enabled${i}`)
                const defaultValue = document.getElementById(`${commands.user_level}${i}`)
                const commandInput = document.getElementById(`commandaction${i}`)
                const userLevel = document.getElementById(`userlevel${i}`)
                defaultValue.setAttribute("selected", "selected")
                //console.log(enabled)
                let isEnableToggled = false;
                let isEditToggled = false;
                if(commands.enabled === 1){
                    isEnableToggled = true
                }else {
                    enable.innerText = "Disabled"
                }
                
                enabled[i].addEventListener("click", () => {
                    if(isEnableToggled){
                        updateCommandEnabled(getCookie("username"), commands.command_name, 0);
                        enable.innerText = "Disabled"
                    }
                    else{
                        updateCommandEnabled(getCookie("username"), commands.command_name, 1);
                        enable.innerText = "Enabled"
                        
                    }
                    isEnableToggled = !isEnableToggled;
                })
                //Update Button Submit

                const update = document.getElementById(`update${i}`)
                update.addEventListener("click", () => {
                    updateCommand(getCookie("username"), commands.command_name, commandInput.value, userLevel.value, commands.enabled)
                })
            }
            

            //Edity Button Toggle
            // const edit = document.getElementsByClassName("edit")
            // edit[i].addEventListener("click", () => {
            //     console.log("click edit")
            //     const oldElement = document.getElementById("commandaction")
            //     const newElement = document.createElement("input")
            //     newElement.setAttribute("value", `${commands.action}`)
            //     newElement.setAttribute("type", "text")
            //     newElement.setAttribute("id", "commandaction")
            //     if(!isEditToggled){
            //         newElement.replaceWith(oldElement)
            //     }
            //     else{
            //         const oldElement2 = document.getElementById("commandaction")
            //         const newElement2 = document.createElement("p")
            //         newElement2.innerText = `${commands.action}`
            //         oldElement2.replaceWith(newElement2)
            //     }
            //     isEditToggled = !isEditToggled;
            // })
            i++
        }

    })
    .catch(err => console.error("unable to reach server - getCommands"))
}


async function addWhitelist(username, command, whitelist){
    await fetch(`${server}/commands/whitelist/add`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}", "whitelist": "${whitelist}"}`
    })
}

async function delWhitelist(username, command, whitelist){
    await fetch(`${server}/commands/whitelist/delete`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}", "whitelist": "${whitelist}"}`
    })
}

async function getWhitelist(username){
    await fetch(`${server}/commands/whitelist/get`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json",
        },
        body: `{"username": "${username}"}`
    })
    .then((res) => res.json())
    .then((json) => {
        for(let i = 0; i < json.length; i++){
            console.log(json[i])
            let ul = document.getElementById(`whitelisted${json[i].command_id}`)
            let div = document.createElement("span")
            div.innerHTML = `<span id="username${i}">${json[i].username}</span><span><button class="deletewhitelist"><a>Delete</a></button></span>`
            const del = document.getElementsByClassName("deletewhitelist")
            ul.appendChild(div)
            const username = document.getElementById(`username${i}`)
            del[i].addEventListener("click", () => {
                delWhitelist(getCookie("username"), json[i].command_id, json[i].username)
                .then(
                    setTimeout(() => {
                        console.log("reloading"); 
                        location.href = "/pages/profile.html"
                    }, 750)
                )
            })
        }
        
        })
        .catch(err => console.error("unable to reach server - getWhitelist"))
}

async function getCommandById(commandid){
    await fetch(`${server}/commands/get`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json",
        },
        body: `{"commandid": "${commandid}"}`
    })
    .then((res) => {
       res.json()
    })
    .then((json) => {
        console.log(json)
    })
}

async function addCommand(username, command, action, userlevel){
    console.log("add command")
    await fetch(`${server}/commands/add`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
            "Content-Type": "application/json"
        },
        body: `{"username": "${username}", "command": "${command}", "action": "${action}", "userlevel": "${userlevel}"}`
    })
}

 async function delCommand(username, command){
    // console.log("delete command")
    await fetch(`${server}/commands/`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getCookie('auth')}`,
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

function disableSpaces(input) {
    return input.replace(/ /g, '');
  }
  
  const input = document.querySelector('input');
  
  input.addEventListener('input', () => {
    input.value = disableSpaces(input.value);
    if(input.value.length === 1 && input.value.charAt(0)!="!"){
        input.value = "!" + input.value
    }
});