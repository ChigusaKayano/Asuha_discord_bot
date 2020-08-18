//Mute.js//
const discord = require("discord.js");


class Mute {
    constructor(message, config, client, token) {
        this.message = message;
        this.prefix = config.client.prefix;
        this.token = token;
        this.client = client;
        this.commands = "mute";
    }
    redirect() {
        let args = this.message.content.slice().split(/ /); // init the var which contain the message/command args
        if(this.message.author.id !== this.client.user.id) {
            switch (args[0].toLowerCase()) {
                case this.prefix + "mute":
                    this.mute();
                    break;
                case this.prefix + "tempmute":
                    break;
                case this.prefix + "unmute":
                    break;
                case this.prefix + "help":
                    break;
            }
        }
    }
    mute() {
        let args = this.message.content.slice().split(/ /); // init the var which contain the message/command args
        let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`
        let db = new Database(this.token);
        db.connection().query(`SELECT roleId FROM moderation_${this.message.guild.id}`, (err, rows) => {
            if (err) throw err;
            let Role = rows;
            db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                if (err) throw err;
                let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.clear;
                if (Role.length >= 1) {
                    let answer = false;
                    for (let i = 0; Role.length > i; i++) {
                        if (this.message.guild.member(this.message.author.id).roles.cache.some(role => role.id === Role[i].roleId)) {
                            answer = true;
                        }
                    }
                    if (answer) {

                    } else {
                        this.message.delete().then().catch(console.error);
                        this.message.channel.send().then(message => message.delete({timeout: 10000})).catch(console.error);
                    }
                }
            });
        });
    }
}

module.exports = {
    Mute
}
