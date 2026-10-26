require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); 
const multer = require('multer'); // Para subida de archivos
const fs = require('fs'); // Módulo nativo File System
const csv = require('csv-parser'); // Para leer CSV
const { Parser } = require('json2csv'); // Para exportar CSV

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Parte I: Configuración de Subida de Archivos (Multer)
// Se crea la configuración para guardar temporalmente en la carpeta 'uploads'
const upload = multer({ dest: 'uploads/' });

// --- ENDPOINTS ANTERIORES (GET, POST, PUT, DELETE) ---
app.get('/api/recursos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM libros');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno' });
    }
});
// (Omito los demás GET por ID, PUT y DELETE por brevedad, pero tu API sigue funcionando igual)


// --- Parte II: Importación (Lectura y Carga) ---
// Endpoint POST que recibe un archivo bajo el campo 'archivo'
app.post('/api/recursos/importar', upload.single('archivo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ mensaje: 'No se adjuntó ningún archivo' });
    }

    const filePath = req.file.path;
    // Identificar el tipo de archivo por la extensión original
    const extension = req.file.originalname.split('.').pop().toLowerCase();

    try {
        if (extension === 'json') {
            // Leer el archivo subido y convertir texto a JSON
            const data = fs.readFileSync(filePath, 'utf8');
            const libros = JSON.parse(data);
            
            // Inserción iterativa en MySQL
            for (const libro of libros) {
                await db.query('INSERT INTO libros (nombre, autor) VALUES (?, ?)', [libro.nombre, libro.autor]);
            }
            
            // Eliminar el archivo temporal
            fs.unlinkSync(filePath);
            res.status(200).json({ mensaje: `Importación JSON exitosa. Se insertaron ${libros.length} registros.` });
            
        } else if (extension === 'csv') {
            const libros = [];
            // Leer CSV fila por fila
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => { libros.push(row); })
                .on('end', async () => {
                    for (const libro of libros) {
                        await db.query('INSERT INTO libros (nombre, autor) VALUES (?, ?)', [libro.nombre, libro.autor]);
                    }
                    fs.unlinkSync(filePath);
                    res.status(200).json({ mensaje: `Importación CSV exitosa. Se insertaron ${libros.length} registros.` });
                });
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({ mensaje: 'Formato no soportado, usa .json o .csv' });
        }
    } catch (error) {
        console.error(error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Limpiar en caso de error
        res.status(500).json({ mensaje: 'Error al procesar el archivo' });
    }
});


// --- Parte III: Exportación ---
// Endpoint GET dinámico para formato json o csv
app.get('/api/recursos/exportar/:formato', async (req, res) => {
    try {
        const formato = req.params.formato.toLowerCase();
        // Consulta para obtener todos los registros
        const [rows] = await db.query('SELECT * FROM libros');

        if (formato === 'json') {
            // Forzar descarga de archivo JSON
            res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
            res.json(rows);
            
        } else if (formato === 'csv') {
            // Transformar objetos a texto CSV
            const json2csvParser = new Parser();
            const csvData = json2csvParser.parse(rows);
            
            // Configurar cabeceras y forzar descarga
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
            res.send(csvData);
        } else {
            res.status(400).json({ mensaje: 'Formato no soportado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor al exportar' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});