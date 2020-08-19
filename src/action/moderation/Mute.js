//Mute.js//
const discord = require("discord.js");
const fs = require("fs");
const {Database} = require("../../database/Database.js");
const {Giphy} = require("../../api/Giphy.js");

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
                let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.mute.mute;
                if (Role.length >= 1) {
                    let answer = false;
                    for (let i = 0; Role.length > i; i++) {
                        if (this.message.guild.member(this.message.author.id).roles.cache.some(role => role.id === Role[i].roleId)) {
                            answer = true;
                        }
                    }
                    if (answer) {
                        db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = "muteRole"`, (err, rows) => {
                            if(err) throw err;
                            if(rows.length >= 1) {
                                if(typeof args[1] !== "undefined") {
                                    let userId;
                                    if (args[1].charAt(0) === "<") {
                                        userId = this.message.mentions.members.first().id;
                                    } else {
                                        userId = args[1];
                                    }
                                    if(userId.length === 18) {
                                        if(userId !== this.message.author.id) {
                                            if(!this.message.guild.member(userId).roles.cache.some(role => role.id === rows[0].value)) {
                                                if(typeof args[2] !== "undefined") {
                                                    let reason = ""; //init of the variable which will contain the reason
                                                    for (let i = 2; args.length > i; i++) {
                                                        reason += args[i];
                                                        reason += " ";
                                                    }
                                                    reason.substring(0, reason.length - 1); //return of the reason
                                                    if (!reason.includes('"')) {
                                                        console.log(rows[0].value)
                                                        this.message.guild.member(userId).roles.add(rows[0].value).then().catch(console.error);
                                                        db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'restriction'`, (err, rows) => {
                                                            if(err) throw err;
                                                            this.message.delete().then().catch();
                                                            let info = [userId, this.message.author.id, reason, "♾️"];
                                                            db.connection().query(`INSERT INTO mute_${this.message.guild.id} (userId, authorId, reason, muteFor) VALUES ("${info[0]}", "${info[1]}", "${info[2]}", "${info[3]}")`, (err, rows) => {
                                                                if(err) throw err;
                                                            })
                                                            new Giphy(this.token.giphy.token).searchGif("kpop heart").then(content => {
                                                                let gifUrl = `https://media.giphy.com/media/${content.data[0].id}/giphy.gif`;
                                                                info.push(gifUrl);
                                                                if (rows.length >= 1) {
                                                                    let channel = this.message.guild.channels.find(channel => channel.id === rows[0].id);
                                                                    channel.send(this.embed(1, info, language)).then().catch(console.error);
                                                                } else {
                                                                    this.message.channel.send(this.embed(1, info, language)).then(message => {
                                                                        message.channel.send(language.noteMessage[0].replace("PREFIX",  this.prefix)).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                                    }).catch(console.error);
                                                                }
                                                            });
                                                        })
                                                    } else { // return a message error when the reason is containing "
                                                        this.message.delete().then().catch();
                                                        this.message.channel.send(language.messageError[6].replace("LETTER", '"')).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                    }
                                                } else { // return a message error if no reason is specified.
                                                    this.message.delete().then().catch();
                                                    this.message.channel.send(language.messageError[5]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                }
                                            } else {

                                            }
                                        } else { // return a message error if the use targeted is the command caller.
                                            this.message.delete().then().catch();
                                            this.message.channel.send(language.messageError[4]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                        }
                                    } else { // return a message error when the specified user is not valid.
                                        this.message.delete().then().catch();
                                        this.message.channel.send(language.messageError[3]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                    }
                                } else { // return a message error when the person that used the command did not specified the user
                                    this.message.delete().then().catch();
                                    this.message.channel.send(language.messageError[2]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                }
                            } else { // return a message error of there is not role muted on the server.
                                this.message.delete().then().catch();
                                this.message.channel.send(this.embed(2, null, language)).then(message => {
                                    db.connection().query(`SELECT id FROM msgId_${this.message.guild.id} WHERE type = 'mute'`, (err, rows) => {
                                        if (err) throw err;
                                        let query;
                                        if (rows.length >= 1) {
                                            query = `UPDATE msgId_${this.message.guild.id} SET id = '${message.id}' WHERE type = 'mute'`;
                                        } else {
                                            query = `INSERT INTO msgId_${this.message.guild.id} (type, id) VALUES ('mute', '${message.id}')`;
                                        }
                                        db.connection().query(query, (err) => {
                                            if (err) throw err
                                        });
                                        message.react("✅").then().catch(console.error);
                                    });
                                }).catch(console.error);
                            }
                        })
                    } else { // return message error when the person that used the command is not a moderator
                        this.message.delete().then().catch(console.error);
                        this.message.channel.send(language.messageError[0]).then(message => message.delete({timeout: 10000})).catch(console.error);
                    }
                }
            });
        });
    }
    embed(Case, info=null, language) {
        switch (Case) {
            case 1:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.guild.member(info[0]).user.avatarURL())
                    .addFields(
                        {name: language.embed.title[0], value: this.message.author, inline: true},
                        {name: language.embed.title[1], value:this.message.guild.member(info[0]).user, inline: true},
                        {name: language.embed.title[2], value: info[3], inline: true},
                        {name: language.embed.title[3], value: "`" + info[2] + "`", inline: false}
                    )
                    .setImage(info[4])
                    .setColor("ORANGE")
                    .setFooter(`@florian_kyn`, "https://i.imgur.com/2XRrIuv.png")
                    .setTimestamp();
                break;
            case 2:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.author.avatarURL())
                    .setDescription(language.embed.description)
                    .setColor("RED")
                    .setFooter(`@florian_kyn`, "https://i.imgur.com/2XRrIuv.png")
                    .setTimestamp();
                break;
        }
    }
}
class MuteReact {
    constructor(reaction, user, config, client, token) {
        this.reaction = reaction;
        this.user = user;
        this.prefix = config.client.prefix;
        this.token = token;
        this.role = config.roles.muted;
        this.client = client;
    }
    thumbnailUrlToId(thumbnailUrl) {
        let id = ""
        for(let i = 35; i <= 52; i++) {
            id += thumbnailUrl.charAt(i)
        } return id;
    }
    react() {
        let db = new Database(this.token);
        let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`
        if(this.user.id !== this.client.user.id) {
            db.connection().query(`SELECT id FROM msgId_${this.reaction.message.guild.id} WHERE type = 'mute'`, (err, rows) => {
                if (err) throw err;
                if(this.reaction.users.cache.some(user => user.id === this.thumbnailUrlToId(this.reaction.message.embeds[0].thumbnail.url))) {
                    if(this.reaction.message.id === rows[0].id) {
                        this.reaction.message.guild.roles.create({
                            data: {
                                name: this.role.name,
                                color: this.role.color,
                                permissions: this.role.permissions,
                                position: this.role.position
                            }
                        }).then(role => {
                            db.connection().query(`INSERT INTO setting_${this.reaction.message.guild.id} (type, value) VALUES ("muteRole", "${role.id}")`, (err) => {
                                if(err) throw err;
                            });
                        }).catch(console.error);
                        if(this.reaction.message.guild.roles.cache.find(roles => roles.name === this.role.name)) {
                            let channelIds = [];
                            this.reaction.message.guild.channels.cache.map(channel => channelIds.push(channel.id))
                            for(let i = 0; channelIds.length > i; ++i) {
                                let fetchChannel = this.reaction.message.guild.channels.cache.find(r => r.id === channelIds[i]);
                                fetchChannel.createOverwrite(this.reaction.message.guild.roles.cache.find(role => role.name === this.role.name), {
                                    SEND_MESSAGES: false,
                                    EMBED_LINKS: false,
                                    ATTACH_FILES: false,
                                    SPEAK: false,
                                    MENTION_EVERYONE: false,
                                    CREATE_INSTANT_INVITE: false
                                }, "permissions changed for the role muted.").then().catch(console.error);
                            }
                        }
                        this.reaction.message.delete().then(message => {
                            db.connection().query(`SELECT value FROM setting_${this.reaction.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                                if (err) throw err;
                                let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.mute.mute;
                                message.channel.send(this.embed(1, language)).then(message => message.delete({timeout: 10000})).catch(console.error);
                            });
                        }).catch(console.error);
                    }
                } else {
                    let UserReactions = this.reaction.message.reactions.cache.filter(reaction => reaction.users.cache.has(this.user.id));
                    try {
                        for (const reaction of UserReactions.values()) {
                            reaction.users.remove(this.user.id);
                        }
                    } catch (error) {
                        console.error('Failed to remove reactions.');
                    }
                }
            });
        }
    }
    embed(Case, language) {
        switch (Case) {
            case 1:
                return new discord.MessageEmbed()
                    .setAuthor(this.reaction.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.reaction.message.author.avatarURL())
                    .setDescription(language.noteMessage[1].replace("ROLE", this.reaction.message.guild.roles.cache.find(role => role.name === this.role.name).name))
                    .setColor("GREEN")
                    .setFooter(`@florian_kyn`, "https://i.imgur.com/2XRrIuv.png")
                    .setTimestamp();
                break;
        }
    }
}

module.exports = {
    Mute,
    MuteReact
}
