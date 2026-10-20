require("dotenv").config();
const mysql = require('mysql');
const database = {
    host : process.env.MYSQL_HOST || 'localhost',
    user : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
};

const bd = mysql.createConnection(database);

bd.connect(function (err) {
    if (err) {
        console.error('Error en la conexión de la base de datos:',err);
        process.exit();
    }
})
module.exports = bd;
