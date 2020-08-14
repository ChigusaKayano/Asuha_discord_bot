//ModerationRole.js//
const discord = require("discord.js");
const fs = require("fs")
const {Database} = require("../../database/Database.js");

class ModerationRole {
    constructor(message, config, client, token) {
        this.message = message;
        this.prefix = config.client.prefix;
        this.token = token;
        this.client = client;
        this.commands = "role";
    }
    redirect() {
        let args = this.message.content.slice().split(/ /); // init the var which contain the message/command args
        if(this.message.author.id !== this.client.user.id) {
            if(args[0] === this.prefix + this.commands) {
                let db = new Database(this.token);
                db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                    if(err) throw err;
                    let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.administration.moderationRole;

                    if(this.message.guild.member(this.message.author.id).hasPermission("ADMINISTRATOR")) {
                        if(typeof args[1] === "undefined") return /*TODO: return an embed to help the user with the commands for 30 sec*/;
                        switch (args[1]) {
                            case "set": //TODO: add role that will be allowed to use moderation commands in the db
                                if(typeof args[2] !== "undefined") {
                                    let roleId;
                                    if (args[2].charAt(0) === "<") {
                                        roleId = this.message.mentions.roles.first().id;
                                    } else {
                                        roleId = args[2];
                                    }
                                    if(this.message.guild.roles.cache.some(role => role.id === roleId)) {
                                        db.connection().query(`SELECT roleId FROM moderation_${this.message.guild.id} WHERE roleId = '${roleId}'`, (err, rows) => {
                                            if(err) throw err;
                                            if(rows.length < 1) {
                                                db.connection().query(`INSERT INTO moderation_${this.message.guild.id} VALUES ("${roleId}")`, (err) => {
                                                    if(err) throw err;
                                                    let info = [this.message.author, `<@&${roleId}>`];
                                                    this.message.delete().then().catch(console.error);
                                                    this.message.channel.send(this.embed(1, language, info)).catch(console.error);
                                                });
                                            } else {
                                                this.message.delete().then().catch(console.error);
                                                this.message.channel.send(language.set.messageError[2]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                            }
                                        });
                                    } else {
                                        this.message.delete().then().catch(console.error);
                                        this.message.channel.send(language.set.messageError[1]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                    }
                                } else {
                                    this.message.delete().then().catch(console.error);
                                    this.message.channel.send(language.set.messageError[0]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                }
                                break;
                            case "remove": //TODO: remove from the db the targeted role which will not be longer allowed to use the moderation commands
                                break;
                            case "help": //TODO: display an help embed for an unlimited time
                                break;
                        }
                    } else {
                        this.message.delete().then().catch(console.error);
                        this.message.channel.send(language.messageError[0]).then(message => message.delete({timeout: 5000})).catch(console.error);
                    }
                });
            }
        }
    }
    embed(Case, language, info=null) {
        switch (Case) {
            case 1:
                return new discord.MessageEmbed()
                    .setAuthor(this.client.user.username, this.client.user.avatarURL())
                    .setThumbnail(this.message.author.avatarURL())
                    .addFields(
                        {name: language.set.embed.titles[2], value: language.set.embed.value.replace("AUTHOR", info[0].username), inline: false},
                        {name: language.set.embed.titles[0], value: info[0], inline: true},
                        {name: language.set.embed.titles[1], value: info[1], inline: true}
                    )
                    .setTimestamp()
                    .setFooter(`florian_kyn`, "https://i.imgur.com/2XRrIuv.png")  // pos 0 => the text display in the footer | pos 2 => the image display in the footer
                    .setColor("RED") // the color of the embed
                break;
        }
    }
}

module.exports = {
    ModerationRole
}
