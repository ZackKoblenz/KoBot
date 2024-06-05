const express = require('express')
require('dotenv').config()
const pool = require('./database')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3000
let auth_code; //ONLY DEFINED ON LOG IN - FIX BUG 001
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
    "wack_ko"
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
        //.then(() => console.log(data))

        await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${opts.identity.password}`,
                "Client-ID": clientID
            }
        })
        .then((response) => response.json())
        .then((json) => broadcaster_id = json.data[0].id)
        //.then(() => console.log(broadcaster_id))
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
        for(let i = 0; i < opts.channels.length; i++){
            //console.log(opts.channels[i].split("#")[1])
            getCommands(`${opts.channels[i].split("#")[1]}`)
            .then((res) => {
               //console.log(res)
               for(let j = 0; j < res.length; j++){
                //console.log(`Iteration: ${j}, Response.length: ${res.length}`)
                if(res[j]){
                    if(commandName === res[j].command_name){
                        client.say(target, res[j].action)
                    }
                }
                else{
                    console.log(`*Unknown command ${commandName}`)
                }
            }
            })
        }
        
        
        
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
    getProfilePic(req.params.username)
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
    getAndOrCreateUser(username, profile_picture)
    
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

app.post('/commands', (req,res) => {
    getCommands(req.body.username)
    .then((response) => {
        res.send(response);
    })
})

app.post('/commands/add', (req,res) => {
    addCommand(req.body.username, req.body.command, req.body.action, req.body.userlevel)
})

app.delete('/commands', (req,res) => {
    delCommand(req.body.username, req.body.command).then(()=> res.send(`${req.body.command} deleted.`))
    
})

app.patch('/commands', (req,res) => {
    updateCommand(req.body.username, req.body.command, req.body.action)
})

async function getAndOrCreateUser(username, profile_picture)
{
    let userid = await getUserID(username)
    .then((res) =>{
        return res
    })
    //console.log(userid)
    if(userid){
        return
    }
    else{
        createUser(username, profile_picture)
    }
}

function addChannel(username){
    if(!opts.channels.includes(username)){
        opts.channels.push(username)
        client.join(username)
        //console.log(opts.channels)
        //console.log(client.getChannels())
        
    }
}

async function createUser(username, profile_picture){
    try {
      await pool.promise().query(`USE ${database}`)
      
      const [rows, fields] = await pool.promise().query('INSERT INTO users (username, profile_picture) VALUES (?,?)', [`${username.toString()}`, `${profile_picture.toString()}`]);
      console.log(rows)
      console.log(fields)
    }
    catch (err){
      console.log(err.sqlMessage)
    }
  }

async function getProfilePic(username){
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
        if(typeof rows[0] === 'undefined'){
            return false
        }
        else {
            //console.log(rows[0].user_id)
            return rows[0].user_id
        }
        
    }
    catch (err){
        console.log(err)
    }
}

async function updateUser(){

}

async function delUser(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then(
            (response) => { return response}
        )
        await delAllWhitelist(username)
        await delAllCommands(username)
        const [rows, fields] = await pool.promise().query('DELETE FROM users WHERE id = ?', [userid])
    }
    catch(err){
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

async function delWhitelist(username, command){
    try{
        await pool.promise().query(`USE ${database}`)
        let commandid = await getCommandID(username, command)
        const [rows, fields] = await pool.promise().query('DELETE FROM approved_users WHERE command_id = ?', [commandid])
    }
    catch (err){
        console.log(err)
    }
}


async function delAllWhitelist(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let commandids = []
        await getCommands(username)
        .then((res) => {
            for(let i = 0; i < res.length; i++){
               commandids.push(res[i].id)
            }
        })
        for(let i = 0; i < commandids.length; i++){
            const [rows, fields] = await pool.promise().query('DELETE FROM approved_users WHERE command_id = ?', [commandids[i]])
        }
        
    }
    catch (err){
        console.log(err)
    }
}
async function getWhitelist(){

}

//addCommand("zack_ko", "anotherone", "shows that this works dynamically")
//addWhitelist("wack_ko", "command2", "zack_ko")

async function addCommand(username, command, action, userlevel, enabled = true){
    try{
        await pool.promise().query(`USE ${database}`)
        var userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('INSERT INTO commands (user_id, command_name, action, user_level, enabled) VALUES (?,?,?,?,?)',[userid, command, action, userlevel, enabled])
    }
    catch(err){
        console.log(err.sqlMessage)
    }
}

async function getCommandID(username, command){
    try{
        await pool.promise().query(`USE ${database}`)
        var userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('SELECT id FROM commands WHERE user_id = ? AND command_name = ?', [userid, command])
        //console.log(rows[0].id)
        return rows[0].id
    }
    catch (err){
        console.log(err)
    }
}

async function getCommands(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('SELECT * FROM commands WHERE user_id = ?', [userid])
        return rows
    }
    catch (err){
        console.log(err)
    }
}

async function updateCommand(username, command, action, userlevel = "everyone"){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('UPDATE commands SET action = ? WHERE user_id = ? AND command_name = ?', [action, userid, command])
    }catch(err){
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
        delWhitelist(username, command)
        const [rows, fields] = await pool.promise().query('DELETE FROM commands WHERE id = ?',[commandid])
    }
    catch (err){
        console.log(err)
    }
}

async function delAllCommands(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let commandids = []
        await getCommands(username)
        .then((res) => {
            for(let i = 0; i < res.length; i++){
               commandids.push(res[i].id)
            }
        })
        for(let i = 0; i < commandids.length; i++){
            const [rows, fields] = await pool.promise().query('DELETE FROM commands WHERE id = ?', [commandids[i]])
        }
        
    }
    catch (err){
        console.log(err)
    }
}