const express = require('express')
require('dotenv').config()
const pool = require('./database')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3000
let auth_code;
const tmi = require('tmi.js');
const clientID = process.env.CLIENT_ID
// Define configuration options
const opts = {
  identity: {
    username: 'zackkobot',
    password: process.env.BOT_AUTH
  },
  channels: [
    'wack_ko'
  ]
};

// pool.getConnection(function(err) {
//     if (err) throw err;
//     console.log("Connected!")
// })

let channelName;
// Create a client with our options
const client = new tmi.client(opts);
//Replace with Database Connection
let approvedUsers = ["zack_ko", "wack_ko"]
// Register our event handlers (defined below)
client.on('message', getChannel)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();



// Called every time a message comes in
async function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot
    // Remove whitespace from chat message
    const commandName = msg.trim();
    // If the command is known, let's execute it
    if (commandName === '!dice') {
        const num = rollDice();
        client.say(target, `You rolled a ${num}`);
        console.log(`* Executed ${commandName} command`);
    } 
    // MOD ME COMMAND
    else if (commandName === "mod me") {
        if (approvedUsers.includes(context.username)){
            client.say(target, `/mod ${context.username}`)

            let data;
            let broadcaster_id

            await fetch(`https://api.twitch.tv/helix/users?login=${context.username}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${opts.identity.password}`,
                    "Client-ID": clientID
                }
            })
            .then((response) => response.json())
            .then((json) => data = json)
            //Get Broadcaster ID
            await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${opts.identity.password}`,
                    "Client-ID": clientID
                }
            })
            .then((response) => response.json())
            .then((json) => broadcaster_id = json.data[0].id)

            await fetch(`https://api.twitch.tv/helix/channels/vips?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${auth_code}`,
                    "Client-ID": clientID
                }
            })
            .then(
                await fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${auth_code}`,
                        "Client-ID": clientID
                    }
                })
            )
        }else {
            console.log("user is not authorized")
        }
    }
    // VIP ME COMMAND  
    else if (commandName === "vip me") {
        if (approvedUsers.includes(context.username)){
        client.say(target, `/unmod ${context.username}`)
        client.say(target, `/vip ${context.username}`)

        let data;
        let broadcaster_id
        await fetch(`https://api.twitch.tv/helix/users?login=${context.username}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${opts.identity.password}`,
                "Client-ID": clientID
            }
        })
        .then((response) => response.json())
        .then((json) => data = json)
        .then(() => console.log(data))

        await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${opts.identity.password}`,
                "Client-ID": clientID
            }
        })
        .then((response) => response.json())
        .then((json) => broadcaster_id = json.data[0].id)
        .then(() => console.log(broadcaster_id))
        // console.log(broadcaster_id)
        // console.log(context.username)
        // console.log(data.data[0].id)
    // Unmod User
        await fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${auth_code}`,
                "Client-ID": clientID
            }
        })
    // VIP User
        .then(
            await fetch(`https://api.twitch.tv/helix/channels/vips?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${auth_code}`,
                    "Client-ID": clientID
                }
            })
        )
    }
    //Add Custom Command parser
    }
    else {
        console.log(`* Unknown command ${commandName}`);
    }


}

async function getChannel(channel, user, message, action){
    console.log(channel.slice(1))
    console.log(`${user.username}: ${message}`)
    channelName = channel.slice(1)
    return channel.slice(1)
}
// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}


// We are using our packages here
app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true})); 
app.use(cors())

//You can use this to check if your server is working
app.get('/', (req, res)=>{
    res.send("Welcome to your server")
})

app.get('/channels', (req, res) => {
    res.send(client.getChannels())
})

app.post('/auth', (req, res) =>{
    auth_code = req.body.code
    //console.log(req.body.code)
    //console.log(auth_code)
    //console.log(req.body.username)
    addChannel(req.body.username)
    //console.log(client.getChannels())
})

//Route that handles login logic
app.post('/login', (req, res) =>{
    let requestBody = req.body
    console.log(requestBody)
    console.log(req.body.username) 
    console.log(req.body.password)
    res.send("post request recieved") 
})

//Route that handles signup logic
app.post('/signup', (req, res) =>{
    console.log(req.body.fullname) 
    console.log(req.body.username)
    console.log(req.body.password) 
})

app.post('/part', (req, res) => {
    if(client.getChannels().includes(`#${req.body.username}`)){
        client.part(req.body.username)
        .catch(error => console.log(error))
        console.log("Parting Channel")
    }
})

app.post('/join', (req, res) => {
    if(!client.getChannels().includes(`${req.body.username}`)){
        client.join(req.body.username)
        .catch(error => console.log(error))
        console.log("Joining Channel")
    }
})

//Start your server on a specified port
app.listen(port, () => {
    console.log(`Server is runing on port ${port}`)
})

function addChannel(username){
    if(!opts.channels.includes(username)){
        opts.channels.push(username)
        client.join(username)
        console.log(opts.channels)
        console.log(client.getChannels())
    }
}