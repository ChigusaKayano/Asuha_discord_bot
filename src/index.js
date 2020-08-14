//index.js//
//discord init
const discord = require("discord.js");
const client = new discord.Client({partials: ['MESSAGE', 'CHANNEL', 'REACTION']});
//node init
const fs = require("fs");
//json var init
const config = JSON.parse(fs.readFileSync("./config/configuration.json"));
const token = JSON.parse(fs.readFileSync("./config/token.json"));
//Class imports

//event listener
client.on("ready", () => {
    let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`
    console.log(`[${time}] The client '${client.user.username}' has been connected.`)
});

client.login(token.discord.token);
