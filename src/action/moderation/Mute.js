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
                    if(args[1].toLowerCase() === "help") {
                        this.help();
                    } else {
                        this.mute();
                    }
                    break;
                case this.prefix + "tempmute":
                    this.tempMute();
                    break;
                case this.prefix + "unmute":
                    this.unmute();
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
                                                            console.log(`[${time}] '${this.message.author.tag}' has mute '${this.message.guild.member(userId).user.tag}' for an unlimited time because: ${info[2]}`);
                                                        })
                                                    } else { // return a message error when the reason is containing "
                                                        this.message.delete().then().catch();
                                                        this.message.channel.send(language.messageError[7].replace("LETTER", '"')).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                    }
                                                } else { // return a message error if no reason is specified.
                                                    this.message.delete().then().catch();
                                                    this.message.channel.send(language.messageError[6]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                }
                                            } else { // return a message error if the targeted user is already muted.
                                                this.message.delete().then().catch();
                                                this.message.channel.send(language.messageError[5]).then(message => message.delete({timeout: 10000})).catch(console.error);
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
    tempMute() {
        let args = this.message.content.slice().split(/ /); // init the var which contain the message/command args
        let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`;
        let db = new Database(this.token);
        db.connection().query(`SELECT roleId FROM moderation_${this.message.guild.id}`, (err, rows) => {
            if (err) throw err;
            let Role = rows;
            db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                if (err) throw err;
                let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.mute.tempmute;
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
                                                if( 5 < args[2] < 360) {
                                                    if (typeof args[3] !== "undefined") {
                                                        let reason = ""; //init of the variable which will contain the reason
                                                        for (let i = 3; args.length > i; i++) {
                                                            reason += args[i];
                                                            reason += " ";
                                                        }
                                                        reason.substring(0, reason.length - 1); //return of the reason
                                                        if (!reason.includes('"')) {
                                                            this.message.guild.member(userId).roles.add(rows[0].value).then().catch(console.error);
                                                            db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'restriction'`, (err, rows) => {
                                                                if (err) throw err;
                                                                let setting = rows;
                                                                this.message.delete().then().catch();
                                                                let info = [userId, this.message.author.id, reason, args[2]];
                                                                db.connection().query(`INSERT INTO mute_${this.message.guild.id} (userId, authorId, reason, muteFor) VALUES ("${info[0]}", "${info[1]}", "${info[2]}", "${info[3]}")`, (err, rows) => {
                                                                    if (err) throw err;
                                                                })
                                                                new Giphy(this.token.giphy.token).searchGif("kpop heart").then(content => {
                                                                    let gifUrl = `https://media.giphy.com/media/${content.data[0].id}/giphy.gif`;
                                                                    info.push(gifUrl);
                                                                    if (rows.length >= 1) {
                                                                        let channel = this.message.guild.channels.find(channel => channel.id === rows[0].id);
                                                                        channel.send(this.embed(3, info, language)).then().catch(console.error);
                                                                    } else {
                                                                        this.message.channel.send(this.embed(3, info, language)).then(message => {
                                                                            message.channel.send(language.noteMessage[0].replace("PREFIX", this.prefix)).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                                        }).catch(console.error);
                                                                    }
                                                                });
                                                                console.log(setting);
                                                                console.log(`[${time}] '${this.message.author.tag}' has mute '${this.message.guild.member(userId).user.tag}' for ${info[3]} minutes because: ${info[2]}`);
                                                                setTimeout(() => {
                                                                    if(this.message.guild.member(userId).roles.cache.some(role => role.id === setting[0].value)) {
                                                                        this.message.guild.member(userId).roles.remove(rows[0].value).then().catch(console.error);
                                                                        new Giphy(this.token.giphy.token).searchGif("kpop heart").then(content => {
                                                                            let gifUrl = `https://media.giphy.com/media/${content.data[0].id}/giphy.gif`;
                                                                            db.connection().query(`SELECT * FROM mute_${this.message.guild.id} WHERE userId = '${userId}'`, (err, rows) => {
                                                                                if (err) throw err;
                                                                                if (setting.length >= 1) {
                                                                                    let channel = this.message.guild.channels.find(channel => channel.id === setting[0].value);
                                                                                    channel.send(this.embed(4, rows[rows.length - 1], language)).then().catch(console.error);
                                                                                } else {
                                                                                    this.message.channel.send(this.embed(4, rows[rows.length - 1], language, gifUrl)).then(message => {
                                                                                        message.channel.send(language.noteMessage[0].replace("PREFIX", this.prefix)).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                                                    }).catch(console.error);
                                                                                }
                                                                            });
                                                                            console.log(`[${time}] The mute duration time has expired. '${this.message.guild.member(userId).user.tag}' has been un muted.}`);
                                                                        });
                                                                    }
                                                                }, args[2] * 60000);
                                                            });
                                                        } else { // return a message error when the reason is containing "
                                                            this.message.delete().then().catch();
                                                            this.message.channel.send(language.messageError[8].replace("LETTER", '"')).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                        }
                                                    } else { // return a message error if no reason is specified.
                                                        this.message.delete().then().catch();
                                                        this.message.channel.send(language.messageError[7]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                    }
                                                } else { // return a message error when the amount of minutes specified is under 5 or over 360
                                                    this.message.delete().then().catch();
                                                    this.message.channel.send(language.messageError[6]).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                }
                                            } else { // return a message if the targeted user is already muted.
                                                this.message.delete().then().catch();
                                                this.message.channel.send(language.messageError[5]).then(message => message.delete({timeout: 10000})).catch(console.error);
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
    unmute() {
        let args = this.message.content.slice().split(/ /); // init the var which contain the message/command args
        let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`;
        let db = new Database(this.token);
        db.connection().query(`SELECT roleId FROM moderation_${this.message.guild.id}`, (err, rows) => {
            if (err) throw err;
            let Role = rows;
            db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                if (err) throw err;
                let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.mute.unmute;
                if (Role.length >= 1) {
                    let answer = false;
                    for (let i = 0; Role.length > i; i++) {
                        if (this.message.guild.member(this.message.author.id).roles.cache.some(role => role.id === Role[i].roleId)) {
                            answer = true;
                        }
                    }
                    if (answer) {
                        db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = "muteRole"`, (err, rows) => {
                            if (err) throw err;
                            if (rows.length >= 1) {
                                if (typeof args[1] !== "undefined") {
                                    let userId;
                                    if (args[1].charAt(0) === "<") {
                                        userId = this.message.mentions.members.first().id;
                                    } else {
                                        userId = args[1];
                                    }
                                    if (userId.length === 18) {
                                        if (userId !== this.message.author.id) {
                                            if (this.message.guild.member(userId).roles.cache.some(role => role.id === rows[0].value)) {
                                                this.message.guild.member(userId).roles.remove(rows[0].value).then().catch(console.error);
                                                this.message.delete().then().catch(console.error);
                                                db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'restriction'`, (err, rows) => {
                                                    if (err) throw err;
                                                    let setting = rows;
                                                    db.connection().query(`SELECT * FROM mute_${this.message.guild.id} WHERE userId = '${userId}'`, (err, rows) => {
                                                        if(err) throw err;
                                                        new Giphy(this.token.giphy.token).searchGif("kpop heart").then(content => {
                                                            let gifUrl = `https://media.giphy.com/media/${content.data[0].id}/giphy.gif`;
                                                            if (setting.length >= 1) {
                                                                let channel = this.message.guild.channels.find(channel => channel.id === setting[0].value);
                                                                channel.send(this.embed(4, rows[rows.length - 1], language)).then().catch(console.error);
                                                            } else {
                                                                this.message.channel.send(this.embed(4, rows[rows.length - 1], language, gifUrl)).then(message => {
                                                                    message.channel.send(language.noteMessage[0].replace("PREFIX", this.prefix)).then(message => message.delete({timeout: 10000})).catch(console.error);
                                                                }).catch(console.error);
                                                            }
                                                        });
                                                    });
                                                    console.log(`[${time}] '${this.message.author.tag}' has unmute '${this.message.guild.member(userId).user.tag}`);
                                                });
                                            } else { // return a message if the targeted user is already muted.
                                                this.message.delete().then().catch();
                                                this.message.channel.send(language.messageError[5]).then(message => message.delete({timeout: 10000})).catch(console.error);
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
    help() {
        let db = new Database(this.token);
        let time = `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}:${new Date(Date.now()).getSeconds()}`;
        if(this.message.author !== this.client.user.id) {
            db.connection().query(`SELECT value FROM setting_${this.message.guild.id} WHERE type = 'language'`, (err, rows) => {
                if (err) throw err;
                let language = JSON.parse(fs.readFileSync(`./languages/${rows[0].value}.json`)).commands.moderation.mute.help;
                this.message.delete().then().catch(console.error);
                this.message.channel.send(this.embed(5, null, language)).then().catch(console.error);
                console.log(`[${time}] ${this.message.author.tag} just asked for help with commands related to mute.`);
            });
        }
    }
    embed(Case, info=null, language, image=null) {
        switch (Case) {
            case 1:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.guild.member(info[0]).user.avatarURL())
                    .addFields(
                        {name: language.embed.title[0], value: this.message.author, inline: true},
                        {name: language.embed.title[1], value:this.message.guild.member(info[0]).user, inline: true},
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
            case 3:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.guild.member(info[0]).user.avatarURL())
                    .addFields(
                        {name: language.embed.title[0], value: this.message.author, inline: true},
                        {name: language.embed.title[1], value:this.message.guild.member(info[0]).user, inline: true},
                        {name: language.embed.title[2], value: "`" + `${info[3]} ${language.embed.value[0]}` + "`" , inline: true},
                        {name: language.embed.title[3], value: "`" + info[2] + "`", inline: false}
                    )
                    .setImage(info[4])
                    .setColor("ORANGE")
                    .setFooter(`@florian_kyn`, "https://i.imgur.com/2XRrIuv.png")
                    .setTimestamp();
                break;
            case 4:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.guild.member(info.userId).user.avatarURL())
                    .addFields(
                        {name: language.embed.title[0], value: this.message.guild.member(info.authorId).user, inline: true},
                        {name: language.embed.title[1], value: this.message.guild.member(info.userId).user, inline: true},
                        {name: language.embed.title[2], value: "`" + `${info.muteFor} ${language.embed.value[0]}` + "`", inline: true},
                        {name: language.embed.title[3], value: "`" + info.reason + "`", inline: false}
                    )
                    .setImage(image)
                    .setColor("GREEN")
                    .setFooter(`@florian_kyn`, "https://i.imgur.com/2XRrIuv.png")
                    .setTimestamp();
                break;
            case 5:
                return new discord.MessageEmbed()
                    .setAuthor(this.message.guild.name, this.client.user.avatarURL())
                    .setThumbnail(this.message.guild.member(this.message.author.id).user.avatarURL())
                    .addFields(
                        {name: "`" + `${this.prefix}tempmute <@mention/id> <duration> <reason>` + "`", value: language.commandsDesc[1], inline: false},
                        {name: "`" + `${this.prefix}mute <@mention/id> <reason>` + "`", value: language.commandsDesc[0], inline: false},
                        {name: "`" + `${this.prefix}unmute <@mention/id>` + "`", value: language.commandsDesc[2], inline: false},
                        {name: "`" + `${this.prefix}mute help` + "`", value: language.commandsDesc[3], inline: false}
                    )
                    .setColor("YELLOW")
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
                        console.log(`[${time}] The role Muted has been created. requested by "${this.message.author.tag}".`)
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
