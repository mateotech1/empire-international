const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { signPdf } = require('../controllers/pdfController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

router.post('/generate-link', upload.single('file'), (req, res) => {
  try {
    const uuid = uuidv4();
    const pdfPath = req.file.filename;
    const fields = req.body.fields;
    const encodedFields = encodeURIComponent(fields);
    const link = `http://localhost:3000/sign/${uuid}?file=${pdfPath}&fields=${encodedFields}`;
    res.json({ message: 'Enlace generado con éxito', link });
  } catch (error) {
    console.error('Error en generate-link:', error);
    res.status(500).json({ message: 'Error al generar el enlace', error: error.message });
  }
});

router.post('/submit-signature', async (req, res) => {
  try {
    const { pdfFilePath, signatures } = req.body;

    const pdfPath = path.join(__dirname, '../../uploads', pdfFilePath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF no encontrado' });
    }

    const signedPublicPath = await signPdf(pdfPath, signatures);
    res.json({ message: 'Documento firmado con éxito', signedFilePath: signedPublicPath });
  } catch (error) {
    console.error('Error en submit-signature:', error);
    res.status(500).json({ message: 'Error al firmar', error: error.message });
  }
});

router.get('/list-signed-pdfs', (req, res) => {
  const { page = 1, limit = 10, query = '' } = req.query;
  const pdfDir = path.join(__dirname, '../../documentos_firmados');

  fs.readdir(pdfDir, (err, files) => {
    if (err) {
      console.error('Error al leer la carpeta de PDFs firmados:', err);
      return res.status(500).json({ message: 'Error al leer PDFs', error: err.message });
    }

    const filteredFiles = files
      .filter(file => file.toLowerCase().includes(query.toLowerCase()))
      .map(file => ({
        name: file,
        url: `/documentos_firmados/${file}`,
      }));

    const total = filteredFiles.length;
    const paginatedFiles = filteredFiles.slice((page - 1) * limit, page * limit);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: paginatedFiles || [], // Asegúrate de enviar un arreglo vacío si no hay archivos
    });
  });
});

module.exports = router;
