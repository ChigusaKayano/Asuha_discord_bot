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
}

module.exports = {
    Database
}
