// Conexión a PostgreSQL (Supabase). Sustituye a conexion_mysql.js en server_gestor.js.
// Mantiene la misma forma de usarla:  bd.query(sql, [valores], function(err, resultado){ ... })
require("dotenv").config();
var pg = require("pg");

if (!process.env.DATABASE_URL){
    console.error("Falta DATABASE_URL en el .env / variables de entorno");
    process.exit();
}

var local = process.env.DATABASE_URL.indexOf("localhost") != -1;

// Pool = conjunto de conexiones reutilizables (en la nube las conexiones se cortan y el pool abre otras)
var pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: local ? false : { rejectUnauthorized: false } // Supabase exige conexión cifrada (SSL)
});

pool.on("error", function(err){
    console.error("Conexión inactiva de la BD cerrada:", err.message); // evita que se caiga el servidor
});

// Comprobamos al arrancar que la BD responde (igual que hacía bd.connect en MySQL)
pool.query("SELECT 1", function(err){
    if (err){
        console.error("Error en la conexión de la base de datos:", err.message);
        process.exit();
    }
    console.log("Conectado a PostgreSQL");
});

var bd = {};

bd.query = function(sql, valores, callback){
    // Se puede llamar bd.query(sql, cb) sin valores
    if (typeof valores == "function"){
        callback = valores;
        valores = [];
    }

    // DIFERENCIA 1: MySQL usa "?" y PostgreSQL usa $1, $2, $3...
    var n = 0;
    var sqlPg = sql.replace(/\?/g, function(){
        n++;
        return "$" + n;
    });

    pool.query(sqlPg, valores, function(err, result){
        if (err){
            return callback(err);
        }
        // DIFERENCIA 2: en pg las filas del SELECT vienen en result.rows
        if (result.command == "SELECT"){
            return callback(null, result.rows);
        }
        // DIFERENCIA 3: INSERT/UPDATE/DELETE -> en pg es rowCount, en MySQL era affectedRows
        return callback(null, { affectedRows: result.rowCount });
    });
};

module.exports = bd;
