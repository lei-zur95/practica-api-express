const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el pool de conexión con las variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Exportar el módulo de conexión
module.exports = pool;