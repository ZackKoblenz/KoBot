 
require('dotenv').config()
const client_id = process.env.CLIENT_ID

let access_token;
let data;
let profilePicture;
let username;
let div = document.getElementById('profile_picture')
let img = document.createElement('img')
img.addEventListener('click', function(){
    location.href = "http://localhost:5500/profile.html"
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
    profilePicture = getCookie("profilePicture")
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
//URL will need to be changed to reflect live URL
if(location.href === "http://localhost:5500/profile.html"){

    GetChannels()
    JoinAndPartChannel()
}

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
        let p = document.createElement('p').innerText = "<p>Unable To Reach Server</p>"
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
        body: `{"code": "${access_token}", "username": "${login}"}`
    })
}