//Clear.js//
const discord = require("discord.js");
const fs = require("fs");
const {Database} = require("../../database/Database.js");
const {Giphy} = require("../../api/Giphy.js");

class Clear {
    constructor(message, config, client, token) {
        this.message = message;
        this.prefix = config.client.prefix;
        this.token = token;
        this.client = client;
        this.commands = "clear";
    }
    command() {
        let args = this.message.content.slice().split(/ /); // init the var which contain the message/command args
        let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`
        let db = new Database(this.token);
        if(args[0] === this.prefix + this.commands) {
            db.connection().query(`SELECT roleId FROM moderation_${this.message.guild.id}`, (err, rows) => {
                if(err) throw err;
                let Role = rows;
                db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                    if(err) throw err;
                    let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.clear;
                    if(Role.length >= 1) {
                        let answer = false;
                        for(let i = 0; Role.length > i; i++) {
                            if(this.message.guild.member(this.message.author.id).roles.cache.some(role => role.id === Role[i].roleId)) {
                                answer = true;
                            }
                        }
                        if(answer) {
                            if(typeof args[1] !== "undefined") {
                                if(1 < args[1] < 100) {
                                    this.message.channel.bulkDelete(args[1], true).then().catch(console.error);
                                    new Giphy(this.token.giphy.token).searchGif("kdrama").then(content => {
                                        let gifUrl = `https://media.giphy.com/media/${content.data[0].id}/giphy.gif`;
                                        let info = [gifUrl, args[1]]
                                        this.message.channel.send(this.embed(1, language, info)).then(message => {
                                            message.react("🗑️");
                                            console.log(`[${time}] '@${this.message.author.tag}' deleted '${args[1]}' messages in the channel '#${this.message.channel.name}'.`)
                                            db.connection().query(`SELECT id FROM msgId_${this.message.guild.id} WHERE type = 'clear'`, (err, rows) => {
                                                if(err) throw err;
                                                let query;
                                                if(rows.length >= 1) {
                                                    query = `UPDATE msgId_${this.message.guild.id} SET id = '${message.id}' WHERE type = 'clear'`;
                                                } else {
                                                    query = `INSERT INTO msgId_${this.message.guild.id} (type, id) VALUES ('clear', '${message.id}')`;
                                                }
                                                db.connection().query(query, (err) => {if(err) throw err});
                                            });
                                        }).catch(console.error);
                                    });
                                } else {
                                    this.message.delete().then().catch(console.error);
                                    this.message.channel.send(language.messageError[3]).then(message => message.delete({timeout: 10000})).catch(console.error());
                                }
                            } else {
                                this.message.delete().then().catch(console.error);
                                this.message.channel.send(language.messageError[2]).then(message => message.delete({timeout: 10000})).catch(console.error());
                            }
                        } else {
                            this.message.delete().then().catch(console.error);
                            this.message.channel.send(language.messageError[1]).then(message => message.delete({timeout: 10000})).catch(console.error());
                        }
                    } else {
                        this.message.delete().then().catch(console.error);
                        this.message.channel.send(language.messageError[0]).then(message => message.delete({timeout: 10000})).catch(console.error());
                    }
                })
            });
        }
    }
    embed(Case, language, info) {
        switch (Case) {
            case 1:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.author.avatarURL())
                    .setColor("BLUE")
                    .setDescription(language.embed.description)
                    .addFields(
                        {name: language.embed.title[0], value: this.message.author, inline: true},
                        {name: language.embed.title[1], value: "`" + `${info[1]} ${language.embed.value[0]}` + "`", inline: true}
                    )
                    .setImage(info[0])
                    .setFooter(`@florian_kyn`, "https://i.imgur.com/2XRrIuv.png")
                    .setTimestamp();
                break;
        }
    }
}
class ClearReact {
    constructor(reaction, user, config, client, token) {
        this.reaction = reaction;
        this.user = user;
        this.prefix = config.client.prefix;
        this.token = token;
        this.client = client;
        this.commands = "clear";
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
            db.connection().query(`SELECT id FROM msgId_${this.reaction.message.guild.id} WHERE type = 'clear'`, (err, rows) => {
                if (err) throw err;
                let msgId = rows[0].id;
                if (this.reaction.message.id === msgId && this.reaction.users.cache.some(user => user.id === this.thumbnailUrlToId(this.reaction.message.embeds[0].thumbnail.url))) {
                    this.reaction.message.delete().then(message => {
                        console.log(`[${time}] '@${this.user.tag}' had deleted the clear message embed in the channel '#${this.reaction.message.channel.name}'.`)
                    }).catch(console.error);
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
}
module.exports = {
    Clear,
    ClearReact
}
