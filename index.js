require('dotenv').config();
const express = require('express');
const db = require('./config/db'); // Importar el módulo de conexión
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

// Garantizar que la base de datos se conecte al levantar el servidor e imprimir el mensaje
db.getConnection()
    .then(connection => {
        console.log('Conectado exitosamente a la base de datos');
        connection.release();
    })
    .catch(err => console.error('Error al conectar a la base de datos:', err));

// 1. GET: Realizar un SELECT FROM
app.get('/api/recursos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM libros');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Internal Server Error' });
    }
});

// 2. GET por ID: Realizar un SELECT con WHERE
app.get('/api/recursos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM libros WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Recurso no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Internal Server Error' });
    }
});

// 3. POST: Realizar un INSERT INTO usando req.body
app.post('/api/recursos', async (req, res) => {
    try {
        const { nombre, autor } = req.body;
        const [result] = await db.query('INSERT INTO libros (nombre, autor) VALUES (?, ?)', [nombre, autor]);
        
        res.status(201).json({ id: result.insertId, nombre, autor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Internal Server Error' });
    }
});

// 4. PUT: Ejecutar un UPDATE
app.put('/api/recursos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, autor } = req.body;
        const [result] = await db.query('UPDATE libros SET nombre = ?, autor = ? WHERE id = ?', [nombre, autor, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Recurso no encontrado' });
        }
        res.json({ id, nombre, autor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Internal Server Error' });
    }
});

// 5. DELETE: Ejecutar un DELETE FROM
app.delete('/api/recursos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM libros WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Recurso no encontrado' });
        }
        res.json({ mensaje: `Recurso con ID ${id} eliminado correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});