//Database.js//
const mysql = require("mysql2");

class Database {
    constructor(token) {
        this.dbUsername = token.database.username;
        this.dbDatabase = token.database.database;
        this.dbPassword = token.database.password;
        this.dbServer = token.database.server;
        this.dbPort = token.database.port;
    }
    connection() {
        return mysql.createConnection({
            user: this.dbUsername,
            database: this.dbDatabase,
            password: this.dbPassword,
            host: this.dbServer,
            port: this.dbPort
        })
    }
    checkTablesExistence(client) {
        let guildId = [];
        client.guilds.cache.map(guild => guildId.push(guild.id))
        for(let i = 0; guildId.length > i; i++) {
            this.connection().query(`CREATE TABLE IF NOT EXISTS moderation_${guildId[i]} (roleId VARCHAR(30))`, (err) => {
                if(err) throw err;
            })
        }
    }
}

module.exports = {
    Database
}
