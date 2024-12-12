const publicLinks = new Map();

function cleanExpiredLinks() {
  const now = Date.now();
  for (const [key, value] of publicLinks) {
    if (value.expiresAt < now) {
      publicLinks.delete(key);
    }
  }
}

// Ejecutar limpieza periódica de enlaces expirados
setInterval(cleanExpiredLinks, 60 * 60 * 1000); // Cada 1 hora

module.exports = publicLinks;
