const express = require('express')
require('dotenv').config()
const pool = require('./database')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = process.env.PORT || 3000
const jwt = require('jsonwebtoken')
let auth_code; //ONLY DEFINED ON LOG IN - FIX BUG 001
let profile_picture;
const tmi = require('tmi.js');
const clientID = process.env.CLIENT_ID
const database = process.env.SQL_DATABASE

// Define configuration options
const opts = {
  identity: {
    username: 'zackkobot',
    password: process.env.BOT_AUTH
  },
  channels: [
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
//let approvedUsers = ["zack_ko", "wack_ko"]
// Register our event handlers (defined below)
client.on('message', getChannel)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:






async function CheckApprovedUsers(users){

}
// Called every time a message comes in
async function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot
    // Remove whitespace from chat message
    const commandName = msg.trim().toLowerCase();
    getAuthCode(target.slice(1))
    let approvedUsersObjects = await getWhitelist(target.slice(1))
    // If the command is known, let's execute it
    async function CommandModules (){
        let userid = await getUserID(target.split('#')[1]).then((res)=>{console.log(res) ;return res})
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
        else if (commandName.toLowerCase() === `mod me`) {
           // console.log("mod me ")
            let approvedUsers = []
            let approvedUsersObjects = await getWhitelist(target.slice(1))
            console.log(approvedUsersObjects)
            let commandid = await getCommandID(target.slice(1), "mod me")
            let channels = await getActiveChannels().then((res) => {
                return res
            })
            let commands = [];
            for(let i = 0; i < approvedUsersObjects.length; i++){
                if(approvedUsersObjects[i].command_id === commandid){
                    approvedUsers.push(approvedUsersObjects[i].username)
                }
            }
            for(let i = 0; i < channels.length; i++){
                commands.push(await getCommandsById(`${channels[i].user_id}`).then((res) => {return res}))
            }
            for(let i = 0; i < commands.length; i++){
                for(let j = 0; j < commands[i].length; j++){
                   //console.log(commands[i][j])
                    console.log(commands[i][j].user_id)
                    console.log(await getUserID(target.slice(1)))
                    if(commands[i][j].enabled === 1 && commands[i][j].command_name.toLowerCase() === "mod me" && commands[i][j].user_id === await getUserID(target.slice(1))){
                        if (approvedUsers.includes(context.username)){
                            //client.say(target, `/mod ${context.username}`)
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
                            .then((json) => {data = json})
                            //Get Broadcaster ID
                            await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
                                method: "GET",
                                headers: {
                                    "Authorization": `Bearer ${opts.identity.password}`,
                                    "Client-ID": clientID
                                }
                            })
                            .then((response) => response.json())
                            .then((json) => { broadcaster_id = json.data[0].id})
            
                            await fetch(`https://api.twitch.tv/helix/channels/vips?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
                                method: "DELETE",
                                headers: {
                                    "Authorization": `Bearer ${auth_code}`,
                                    "Client-ID": clientID
                                }
                            })
                            .then((res) => {
                                //console.log(res)
                            })
                            // .then((json) => {
                            //     console.log(json)
                            // })
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
                }
            }
            
        }
        // VIP ME COMMAND  
        else if (commandName.toLowerCase() === "vip me") {
            let approvedUsers = []
            let approvedUsersObjects = await getWhitelist(target.slice(1))
            console.log(approvedUsersObjects)
            let commandid = await getCommandID(target.slice(1), "vip me")
            let channels = await getActiveChannels().then((res) => {
                return res
            })
            let commands = [];
            for(let i = 0; i < approvedUsersObjects.length; i++){
                if(approvedUsersObjects[i].command_id === commandid){
                    approvedUsers.push(approvedUsersObjects[i].username)
                }
            }
            for(let i = 0; i < channels.length; i++){
                commands.push(await getCommandsById(`${channels[i].user_id}`).then((res) => {return res}))
                
            }
            for(let i = 0; i < commands.length; i++){
                for(let j = 0; j < commands[i].length; j++){
                    console.log(commands[i][j])
                    if(commands[i][j].enabled === 1 && commands[i][j].command_name.toLowerCase() === "vip me" && commands[i][j].user_id === await getUserID(target.slice(1))){
                        if(approvedUsers.includes(context.username)){
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
                        else{
                            console.log("user is not authorized")
                        }
                    }
                }
            }
                
            // if (approvedUsers.includes(context.username)){
            //     client.say(target, `/unmod ${context.username}`)
            //     client.say(target, `/vip ${context.username}`)

            //     let data;
            //     let broadcaster_id
            //     await fetch(`https://api.twitch.tv/helix/users?login=${context.username}`, {
            //         method: "GET",
            //         headers: {
            //             "Authorization": `Bearer ${opts.identity.password}`,
            //             "Client-ID": clientID
            //         }
            //     })
            //     .then((response) => response.json())
            //     .then((json) => data = json)
            //     //.then(() => console.log(data))

            //     await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
            //         method: "GET",
            //         headers: {
            //             "Authorization": `Bearer ${opts.identity.password}`,
            //             "Client-ID": clientID
            //         }
            //     })
            //     .then((response) => response.json())
            //     .then((json) => broadcaster_id = json.data[0].id)
            //     //.then(() => console.log(broadcaster_id))
            //     // console.log(broadcaster_id)
            //     // console.log(context.username)
            //     // console.log(data.data[0].id)
            // // Unmod User
            //     await fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
            //         method: "DELETE",
            //         headers: {
            //             "Authorization": `Bearer ${auth_code}`,
            //             "Client-ID": clientID
            //         }
            //     })
            // // VIP User
            //     .then(
            //         await fetch(`https://api.twitch.tv/helix/channels/vips?broadcaster_id=${broadcaster_id}&user_id=${data.data[0].id}`, {
            //             method: "POST",
            //             headers: {
            //                 "Authorization": `Bearer ${auth_code}`,
            //                 "Client-ID": clientID
            //             }
            //         })
            //     )
            // }
        //Add Custom Command parser
        }
        else {
            let channels = await getActiveChannels().then((res)=>{
                return res
            })
            for(let i = 0; i < channels.length; i++){
                //console.log(opts.channels)
                //console.log(client.getChannels()[i].split("#")[1])
                getCommandsById(`${channels[i].user_id}`)
                .then((res) => {
                //console.log(res)
                    for(let j = 0; j < res.length; j++){
                        //console.log(`Iteration: ${j}, Response.length: ${res.length}`)
                        if(res[j]){
                            //console.log(userid)
                            if(userid === res[j].user_id){
                                //console.log(res[j].user_id)
                                if(commandName === res[j].command_name){
                                    if(res[j].enabled === 1){
                                        if(res[j].user_level === "everyone"){
                                            client.say(target, res[j].action)
                                        }
                                        else if((res[j].user_level === "subscriber" && context.subscriber) || (res[j].user_level === "subscriber" && context.mod) || (res[j].user_level === "subscriber" && context.badges.vip)){
                                            client.say(target, res[j].action)
                                        }
                                        else if(res[j].user_level === "moderator" && context.mod){
                                            client.say(target, res[j].action)
                                        }
                                        else if((res[j].user_level === "vip" && context.badges.vip) || (res[j].user_level === "vip" && context.mod)){
                                            client.say(target, res[j].action)
                                        }
                                        else if(res[j].user_level === "broadcaster" && context.badges.broadcaster){
                                            client.say(target, res[j].action)
                                        }
                                        else if(context.badges.broadcaster){
                                            client.say(target, res[j].action)
                                        }
                                        
                                    }
                                    
                                }
                            }
                            
                        }
                        else{
                            console.log(`*Unknown command ${commandName}`)
                        }
                    }
                })
                // getCommands(`${opts.channels[i]}`)
                // .then((res) => {
                // console.log(res)
                //     for(let j = 0; j < res.length; j++){
                //         //console.log(`Iteration: ${j}, Response.length: ${res.length}`)
                //         if(res[j]){
                //             if(commandName === res[j].command_name){
                //                 client.say(target, res[j].action)
                //             }
                //         }
                //         else{
                //             console.log(`*Unknown command ${commandName}`)
                //         }
                //     }
                // })
            }
            
            
            
        }
    }
    CommandModules()
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
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

//You can use this to check if your server is working
app.get('/', (req, res)=>{
    res.send("Welcome to your server")
})

app.get('/channels', authenticateToken, (req, res) => {
    //res.send(client.getChannels())
    async function sendGetChannels(){
        res.send(await getActiveChannels())
        //console.log(await getChannels())
    }
    sendGetChannels()
})

app.param('username', function (req, res, next, id){
    next()
})

app.get('/user/:username', authenticateToken, (req, res) => { 
    getProfilePic(req.params.username)
    .then((response) => {res.send(response)})
    
})
//Replace with database connection and table
const refreshTokens = []

app.post('/auth', (req, res) =>{
    let userid;
    async function getAuthUser(){
        await getUserID(req.body.username).then((res) => {
        //console.log(`This is the response: ${res}`); 
        userid = res
        if(userid){
        }
        else{
            console.log("user does not exist yet")
        }})
    }

    profile_picture = req.body.profile_picture
    username = req.body.username
    auth_code = req.body.code
    const code = {name: username}
    const accessToken = generateAccessToken(code)
    const refreshToken = jwt.sign(code, process.env.REFRESH_TOKEN_SECRET)
    refreshTokens.push()
    //getAuthCode(username)
    //console.log(req.body.code)
    //console.log(auth_code)
    //console.log(req.body.username)
    //addChannel(username)
    getAuthUser().then(async() => {
        await setAuthCode(req.body.code, userid)
        await setJWT(accessToken, userid)
    })
    getAndOrCreateUser(username, profile_picture, auth_code, accessToken)
    res.json({accessToken: accessToken, refreshToken: refreshToken})
    //console.log(client.getChannels())
})



app.post('/token', (req, res) => {
    const refreshToken = req.body.token
    if(refreshToken == null){
        return res.sendStatus(401)
    }
    if(!refreshTokens.includes(refreshToken)){
        return res.sendStatus(403)
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        const accessToken = generateAccessToken({name: user.name})
        res.json({accessToken: accessToken})
    })
})

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null){
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

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

app.delete('/logout', (req, res) => {
    refreshTokens = refreshtokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

app.post('/part', authenticateToken, (req, res) => {
    // if(client.getChannels().includes(`#${req.body.username}`)){
    //     client.part(req.body.username)
    //     .catch(error => console.log(error))
    //     console.log("Parting Channel")
    // }

    delChannel(req.body.jwt)
})

app.post('/join', authenticateToken, (req, res) => {
    // if(!client.getChannels().includes(`${req.body.username}`)){
    //     client.join(req.body.username)
    //     .catch(error => console.log(error))
    //     console.log("Joining Channel")
    // }
    addChannel(req.body.jwt)
})

//Start your server on a specified port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

app.post('/commands', authenticateToken, (req,res) => {
    getUsernameByJWT(req.body.jwt)
    .then(response => 
    {
        getCommandsByUsername(response)
        .then((response) => {
            res.send(response);
        })
    })

    
})

app.post('/commands/get', authenticateToken, (req,res) => {
    getCommandById(req.body.commandid)
    .then((response) => {
        res.send(response)
    })
})

app.post('/commands/add', authenticateToken, (req,res) => {
    console.log("add command")
    addCommand(req.body.username, req.body.command, req.body.action, req.body.userlevel)
})

app.post('/commands/update/all', authenticateToken, (req, res) => {
    updateCommand(req.body.username, req.body.command, req.body.action, req.body.userlevel, req.body.enabled)
})

app.patch('/commands/update/name', authenticateToken, (req, res) => {
    updateCommandName(req.body.username, req.body.command, req.body.name)
})

app.patch('/commands/update/action', authenticateToken, (req, res) => {
    updateCommandAction(req.body.username, req.body.command, req.body.action)
})

app.patch('/commands/update/userlevel', authenticateToken, (req, res) => {
    updateCommandUserLevel(req.body.username, req.body.command, req.body.userlevel)
})

app.post('/commands/update/enable', authenticateToken, (req, res) => {
    updateCommandEnabledState(req.body.username, req.body.command, req.body.enabled)
})

app.delete('/commands', authenticateToken, (req,res) => {
    delCommand(req.body.username, req.body.command).then(()=> res.send(`${req.body.command} deleted.`))
    
})

app.patch('/commands', authenticateToken, (req,res) => {
    updateCommand(req.body.username, req.body.command, req.body.action)
})

app.post('/commands/whitelist/get', authenticateToken, (req, res) => {
    async function awaitGetWhitelist(){
        let resVariable;
        await getWhitelist(req.body.username).then((response) => {resVariable = response})
        res.send(resVariable)
    }
    awaitGetWhitelist()
    
})

app.post('/commands/whitelist/add', authenticateToken, (req,res) => {
    addWhitelist(req.body.username, req.body.command, req.body.whitelist)
})

app.delete('/commands/whitelist/delete', authenticateToken, (req,res) => {
    delWhitelistedUser(req.body.username, req.body.command, req.body.whitelist)
})

app.post('/userid', authenticateToken, (req, res) => {
    async function awaitGetUserId(){
        //console.log(await getUserID(req.body.username))
        let resVariable;
        await getUserIDByJWT(req.body.jwt).then((response) => resVariable = response)
        .catch(err => {console.log(err)})
        if(resVariable){
            res.send(resVariable.toString())
        }
        
    }
    awaitGetUserId()
})


async function JoinAllChannelsOnInit(){
try{
    await client.connect().catch((err => {console.log(err)}));
    const activeChannels = await getActiveChannels()
    if (typeof activeChannels !== 'undefined'){
        for(let i = 0; i < activeChannels.length; i++){
            getUsername(activeChannels[i].user_id).then(res => {
                console.log(`Joining channel: ${res[0].username}`);
                client.join(res[0].username)
            })
        }
    }
    else{
        console.log('sql connection error')
    }
}catch(err){
    console.log(err)
}

}

JoinAllChannelsOnInit()

async function setJWT(jwt, userid){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise()
            .query('UPDATE users SET jwt = ? WHERE id = ?', [`${jwt}`, userid]);
    }catch(err){
        console.log(err)
    }
}

async function setAuthCode(auth_code, userid){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise()
            .query('UPDATE users SET auth_code = ? WHERE id = ?', [`${auth_code}`, userid]);
    }catch(err){
        console.log(err)
    }
}
async function getAuthCode(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) =>{
            return res
        })
        const [rows, fields] = await pool.promise()
            .query('SELECT auth_code FROM users WHERE id = ?', [userid]);
            auth_code = rows[0].auth_code
            //console.log(rows)
        return rows
    }catch(err){
        console.log(err)
    }
}

async function getAndOrCreateUser(username, profile_picture, auth_code, jwt)
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
        createUser(username, profile_picture, auth_code, jwt).then(()=>{addChannel(username, jwt)})
        
    }
}
async function addChannel(jwt){
    // Old Code For Joining Channels
    // if(!opts.channels.includes(username)){
    //     opts.channels.push(username)
    //     client.join(username)
    //     //console.log(opts.channels)
    //     //console.log(client.getChannels())
    // }

    try{
        await pool.promise().query(`USE ${database}`)
        let username = await getUsernameByJWT(jwt)
        .then(
            (response) => { 
                return response 
            }
        )
        let userid = await getUserIDByJWT(jwt)
        .then(
            (response) => { 
                return response 
            }
        )
        .catch(err => {console.log(err)})
        let channels = await getActiveChannels()
        .then(
            (response) => { return response }
        )
        let channelCheck = false
        for(let i = 0; i < channels.length; i++){
            if(channels[i].user_id === userid){
                channelCheck = true
                client.join(username).catch((err)=>{console.log(err)})
            }
        }
        if (channelCheck === false){
            const [rows, fields] = await pool.promise()
            .query('INSERT INTO active_channels (user_id) VALUES (?)', [`${userid}`]);
            console.log("Joining Channel: " + `${username}`)
            client.join(username).catch((err)=>{console.log(err)})
        }
    }
    catch (err){
        console.log(err)
    }
}

async function getActiveChannels(){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise()
        .query('SELECT * FROM active_channels');
        return rows
    }
    catch (err){
        console.log(err.sqlMessage)
    }
}

async function delChannel(jwt){
    try{
        await pool.promise().query(`USE ${database}`)
        let username = await getUsernameByJWT(jwt)
        .then(
            (response) => { return response }
        )
        let userid = await getUserIDByJWT(jwt)
        .then(
            (response) => { return response }
        )
        .catch(err => {console.log(err)})
        const [rows, fields] = await pool.promise()
        .query('DELETE FROM active_channels WHERE user_id = ?', [userid])
        console.log("Parting Channel: " + `${username}`)
        client.part(username).catch((err) => console.log(err))
    }catch(err){
        console.log(err)
    }    
}

async function delChannelByUsername(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then(
            (response) => { return response }
        )
        .catch(err => {console.log(err)})
        const [rows, fields] = await pool.promise()
        .query('DELETE FROM active_channels WHERE user_id = ?', [userid])
        client.part(username).catch((err) => console.log(err))
    }catch(err){
        console.log(err)
    }    
}

async function createUser(username, profile_picture, auth_code, jwt){
    try {
      await pool.promise().query(`USE ${database}`)
      
      const [rows, fields] = await pool.promise().query('INSERT INTO users (username, profile_picture, auth_code, jwt) VALUES (?,?,?,?)', [`${username.toString()}`, `${profile_picture.toString()}`, `${auth_code.toString()}`, `${jwt.toString()}`]);
      //Add !dice, mod me, and vip me commands to commands for user on create user.
      //That way the commands can be whitelisted
      addCommand(username, "mod me", "This command allows a whitelisted user to mod themselves", "broadcaster", 1)
      addCommand(username, "vip me", "This command allows a whitelisted user to VIP themselves", "broadcaster", 1)
      addCommand(username, "!dice", "Allows user to roll a specified amount of dice with specified sides", "everyone", 1)
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
        const [rows, fields] = await pool.promise().query('SELECT distinct(id) as user_id FROM users WHERE username = ?', [username.toString()])
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

async function getUserIDByJWT(jwt){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise().query('SELECT distinct(id) as user_id FROM users WHERE jwt = ?', [jwt])
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
async function getUsernameByJWT(jwt){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise().query('SELECT username FROM users WHERE jwt = ?', [jwt])
        //console.log(rows[0].user_id)
        if(typeof rows[0] === 'undefined'){
            return false
        }
        else {
            //console.log(rows[0].user_id)
            return rows[0].username
        }
        
    }
    catch (err){
        console.log(err)
    }
}
async function getUsername (userid){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise()
        .query('SELECT username FROM users WHERE id = ?', [userid])
        return rows
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
        await delChannelByUsername(username)
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
        console.log(err.sqlMessage)
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

async function delWhitelistedUser(username, command, whitelist){
    try{
        await pool.promise().query(`USE ${database}`)
        command = parseInt(command)
        let commandid;
        if(typeof command === "number"){
            commandid = command
        }
        else{
            commandid = await getCommandID(username, command)
        }
        
        let userid = await getUserID(username)
        const [rows, fields] = await pool.promise().query('DELETE FROM approved_users WHERE command_id = ? AND streamer_id = ? AND username = ?', [commandid, userid, whitelist])

    }
    catch (err) {
        console.log(err.sqlMessage)
    }
}

async function delAllWhitelist(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let commandids = []
        await getCommandsByUsername(username)
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
async function getWhitelist(username){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then(
            (response) => {return response}
        )
        const [rows, fields] = await pool.promise().query('SELECT * FROM approved_users WHERE streamer_id = ?', [userid])
        return rows
    }
    catch (err){
        console.log(err)
    }
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

async function getCommandById(commandid){
    try{
        console.log(commandid)
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise().query('SELECT command_name FROM commands WHERE id=?', [commandid])
        console.log(rows)
        return rows[0]
    }
    catch(err){
        console.log(err.sqlMessage)
    }
}

async function getCommand(username, command){
    try{
        await pool.promise().query(`USE ${database}`)
        var userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('SELECT command_name FROM commands WHERE user_id = ? AND command_name = ?', [userid, command])
        return rows[0]
    }
    catch(err) {
        console.log(err)
    }
}

async function getCommandsByUsername(username){
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

async function getCommandsById(userid){
    try{
        await pool.promise().query(`USE ${database}`)
        const [rows, fields] = await pool.promise().query('SELECT * FROM commands WHERE user_id = ?', [userid])
        return rows
    }
    catch (err){
        console.log(err)
    }
}

async function updateCommand(username, command, action, userlevel, enabled){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('UPDATE commands SET action = ?, user_level = ?, enabled = ? WHERE user_id = ? AND command_name = ?', [action, userlevel, enabled, userid, command])
    }catch(err){
        console.log(err)
    }
}

//write update command function for each parameter

async function updateCommandName(username, command, newName){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('UPDATE commands SET command_name = ? WHERE user_id = ? AND command_name = ?', [newName, userid, command])
    }
    catch (err){
        console.log(err)
    }
}

async function updateCommandAction(username, command, newAction){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('UPDATE commands SET action = ? WHERE user_id = ? AND command_name = ?', [newAction, userid, command])
    }
    catch (err){
        console.log(err)
    }
}

async function updateCommandUserLevel(username, command, userlevel){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('UPDATE commands SET userlevel = ? WHERE user_id = ? AND command_name = ?', [userlevel, userid, command])
    }
    catch(err){
        console.log(err)
    }
}

async function updateCommandEnabledState(username, command, enabled){
    try{
        await pool.promise().query(`USE ${database}`)
        let userid = await getUserID(username)
        .then((res) => {
            return res
        })
        const [rows, fields] = await pool.promise().query('UPDATE commands SET enabled = ? WHERE user_id = ? AND command_name = ?', [enabled, userid, command])
    }
    catch(err){
        console.log(err)
    }
}

async function delCommand(username, command){
    // console.log("delete command")
    // console.log(username)
    // console.log(command)
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
        await getCommandsByUsername(username)
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

