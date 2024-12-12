const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function signPdf(pdfPath, signatures) {
  console.log('🔍 Detalles de entrada:');
  console.log('Ruta del PDF:', pdfPath);
  console.log('Número de firmas:', signatures.length);

  // Verificar y loguear cada firma
  signatures.forEach((signature, index) => {
    console.log(`Firma ${index + 1}:`, signature);
    if (
      !signature.dataURL ||
      !signature.canvasWidth ||
      !signature.canvasHeight
    ) {
      console.error('❌ Datos de entrada incompletos:', signature);
    }
  });

  try {
    // Cargar el PDF original
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Obtener la primera página
    const page = pdfDoc.getPages()[0];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    console.log('🖼️ Dimensiones del PDF:', { width: pageWidth, height: pageHeight });

    // Procesar cada firma
    for (const signature of signatures) {
      const { x, y, width, height, dataURL, canvasWidth, canvasHeight } = signature;

      // Validar que los datos de la firma sean completos
      if (!dataURL || !canvasWidth || !canvasHeight) {
        console.error('❌ Datos incompletos para la firma:', signature);
        continue;
      }

      try {
        // Escalar las coordenadas de la firma
        const scaleX = pageWidth / canvasWidth;
        const scaleY = pageHeight / canvasHeight;

        const adjustedX = x * scaleX;
        const adjustedY = pageHeight - y * scaleY - height * scaleY;

        console.log('📍 Coordenadas ajustadas:', {
          adjustedX,
          adjustedY,
          width: width * scaleX,
          height: height * scaleY,
        });

        if (
          adjustedX < 0 ||
          adjustedX + width * scaleX > pageWidth ||
          adjustedY < 0 ||
          adjustedY + height * scaleY > pageHeight
        ) {
          console.warn('⚠️ Coordenadas de firma fuera de los límites:', {
            adjustedX,
            adjustedY,
            width: width * scaleX,
            height: height * scaleY,
          });
          continue;
        }

        // Incrustar la imagen de la firma
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const embeddedImage = await pdfDoc.embedPng(imageBuffer);

        // Dibujar la imagen en el PDF
        page.drawImage(embeddedImage, {
          x: adjustedX,
          y: adjustedY,
          width: width * scaleX,
          height: height * scaleY,
        });

        console.log('✅ Firma incrustada correctamente');
      } catch (imageError) {
        console.error('❌ Error al procesar la imagen de la firma:', imageError);
      }
    }

    // Guardar el PDF firmado
    const signedPdfBytes = await pdfDoc.save();

    // Crear directorio para documentos firmados
    const signedDir = path.join(__dirname, '../../documentos_firmados');
    fs.mkdirSync(signedDir, { recursive: true });

    // Crear nombre para el PDF firmado
    const originalName = path.basename(pdfPath);
    const signedName = originalName.replace('.pdf', '_signed.pdf');
    const signedFilePath = path.join(signedDir, signedName);

    // Guardar el archivo
    fs.writeFileSync(signedFilePath, signedPdfBytes);
    console.log('✅ PDF firmado guardado en:', signedFilePath);

    return `/documentos_firmados/${signedName}`;
  } catch (error) {
    console.error('❌ Error general al firmar el PDF:', error);
    throw error;
  }
}

module.exports = { signPdf };
