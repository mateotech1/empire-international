const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const SECRET_KEY = "Empire_1452789578international"; // Cambia esto por una clave secreta segura
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "../users.json")));

// Ruta de login
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.users.find((u) => u.username === username && u.password === password);
  
    console.log("Intento de login:", { username, password, userExists: !!user });
  
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
  
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
  

// Middleware para verificar el token
router.use((req, res, next) => {
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/api/generate-link", "/login", "/register"];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. No se proporcionó token" });
  }

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
});

module.exports = router;
