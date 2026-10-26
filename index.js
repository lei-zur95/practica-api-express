const express = require('express');
const app = express();
const port = 3000;

// Configurar la aplicación para que parsee las solicitudes en formato JSON
app.use(express.json());

// Arreglo en memoria para simular una colección de datos (Catálogo de libros)
let libros = [
    { id: 1, nombre: 'El Quijote', autor: 'Miguel de Cervantes' },
    { id: 2, nombre: 'Cien Años de Soledad', autor: 'Gabriel García Márquez' },
    { id: 3, nombre: '1984', autor: 'George Orwell' }
];

// Ruta base (/) que devuelve un mensaje de confirmación
app.get('/', (req, res) => {
    res.send('El servidor está en línea y funcionando correctamente.');
});

// 1. GET /api/recursos: Devuelve el arreglo completo en formato JSON
app.get('/api/recursos', (req, res) => {
    res.json(libros);
});

// 2. GET /api/recursos/:id: Busca un objeto por ID y lo devuelve
app.get('/api/recursos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const libro = libros.find(l => l.id === id);
    
    if (!libro) {
        // Si no existe, devuelve 404 Not Found
        return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    res.json(libro);
});

// 3. POST /api/recursos: Agrega un nuevo objeto y devuelve 201 Created
app.post('/api/recursos', (req, res) => {
    const nuevoLibro = req.body;
    
    // Asignarle un nuevo ID dinámico (el máximo actual + 1)
    const maxId = libros.length > 0 ? Math.max(...libros.map(l => l.id)) : 0;
    nuevoLibro.id = maxId + 1;
    
    libros.push(nuevoLibro);
    res.status(201).json(nuevoLibro);
});

// 4. PUT /api/recursos/:id: Actualiza el objeto en el arreglo y lo devuelve
app.put('/api/recursos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = libros.findIndex(l => l.id === id);
    
    if (index === -1) {
        return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    
    // Actualiza los datos manteniendo el ID original
    libros[index] = { ...libros[index], ...req.body, id: id };
    res.json(libros[index]);
});

// 5. DELETE /api/recursos/:id: Elimina el objeto y devuelve confirmación
app.delete('/api/recursos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = libros.findIndex(l => l.id === id);
    
    if (index === -1) {
        return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    
    libros.splice(index, 1);
    res.json({ mensaje: `Recurso con ID ${id} eliminado correctamente` });
});

// Levantar el servidor en el puerto 3000
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});