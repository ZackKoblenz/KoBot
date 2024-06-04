const express = require('express')
require('dotenv').config()
const pool = require('./database')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3000
let auth_code;
let profile_picture;
const tmi = require('tmi.js');
const clientID = process.env.CLIENT_ID
const database = 'twitch_app2'
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
    if (commandName.split(' ')[0] === '!dice') {
        if(commandName.split(' ').length > 2){
            client.say(target, 'Please use command as instructed')
        }
        else{
            let msgCopy = msg.trim()
            let params = msgCopy.replace('!dice ','')
            const num = rollDice(params);
            client.say(target, `You rolled ${num}`);
            console.log(`* Executed ${commandName} command`);
        }
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
function rollDice (params) {
  const parameters = params.split('d')
  const sides = parameters[1];
  const dice = parameters[0];
  console.log(Number(sides), Number(dice))
  if (!isNaN(Number(sides))){
    let result = 0;
    for(let i = 0; i < dice; i++){
      result += rollDiceSub(sides)
    }  
    return result
  }else{
    return 'nothing. Please use the following notation. (x)d(y)'
  }

}

function rollDiceSub(sides){
    return Math.floor(Math.random() * sides) + 1
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

app.param('username', function (req, res, next, id){
    next()
})

app.get('/user/:username', (req, res) => { 
    getProfilePicQuery(req.params.username)
    .then((response) => {res.send(response)})
    
})

app.post('/auth', (req, res) =>{
    auth_code = req.body.code
    profile_picture = req.body.profile_picture
    username = req.body.username
    
    //console.log(req.body.code)
    //console.log(auth_code)
    //console.log(req.body.username)
    addChannel(username)
    createUserQuery(username, profile_picture)
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

async function createUserQuery(username, profile_picture){
    try {
      await pool.promise().query(`USE ${database}`)
      
      const [rows, fields] = await pool.promise().query('INSERT INTO users (username, profile_picture) VALUES (?,?)', [`${username.toString()}`, `${profile_picture.toString()}`]);
      console.log(rows)
      console.log(fields)
    }
    catch (err){
      console.log(err)
    }
  }

async function getProfilePicQuery(username){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise().query('SELECT distinct(profile_picture) as profile_picture FROM users WHERE username = ?', username.toString())
        let result = rows[0].profile_picture
        //console.log(result)
        return result
    }catch (err){
        console.log(err)
    }
}

async function getUserID(username){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise().query('SELECT distinct(id) as user_id FROM users WHERE username = ?', username.toString())
        //console.log(rows[0].user_id)
        return rows[0].user_id
    }
    catch (err){
        console.log(err)
    }
}

//getUserID("zack_ko").then((res)=> console.log(res))

async function addWhitelist(username, command, whitelisted){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then(
            (response) => { return response}
        )
        let commandid = await getCommandID(username, command)
        const [rows, fields] = await pool.promise().query('INSERT INTO approved_users (streamer_id, command_id, username) VALUES (?,?,?)', [userid, commandid, whitelisted])
    }
    catch(err){
        console.log(err)
    }
}
addCommand("wack_ko", "command2", "say thing")
addWhitelist("wack_ko", "command2", "zack_ko")

async function addCommand(username, command, action){
    try{
        await pool.promise().query(`USE ${database}`)
        var userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('INSERT INTO commands (user_id, command_name, action) VALUES (?,?,?)',[userid, command, action])
    }
    catch(err){
        console.log(err.sqlMessage)
    }
}


//delCommand("wack_ko", "command1")

async function getCommandID(username, command){
    try{
        await pool.promise().query(`USE ${database}`)
        var userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('SELECT id FROM commands WHERE user_id = ? AND command_name = ?', [userid, command])
        console.log(rows[0].id)
        return rows[0].id
    }
    catch (err){
        console.log(err)
    }
}

async function delCommand(username, command){
    try{
        await pool.promise().query(`USE ${database}`)
        var commandid = await getCommandID(username, command)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('DELETE FROM commands WHERE id = ?',[commandid])
    }
    catch (err){
        console.log(err)
    }
}
// async function delWhitelist(){
//     try{
//         const [rows, fields] = await pool.promise().query()
//     }
// }