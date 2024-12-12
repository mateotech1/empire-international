const express = require('express');
const fileUploadRoute = require('./routes/fileUpload');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas estáticas
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/documentos_firmados', express.static(path.join(__dirname, '../documentos_firmados')));

// API Routes
app.use('/api', fileUploadRoute);

// Renderización directa de HTML
app.get('/sign/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sign.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
