const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return users.some((u) => u.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some((u) => u.username === username && u.password === password);
};

// Login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Faltan usuario o contraseña" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
  }

  const accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "Login successful!" });
});

// Añadir o modificar reseña (el texto va en la query: ?review=texto)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Libro no encontrado" });
  }
  if (!review) {
    return res.status(400).json({ message: "Falta el texto de la reseña" });
  }

  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: "Reseña añadida/actualizada correctamente",
    reviews: books[isbn].reviews,
  });
});

// Eliminar la reseña del usuario que ha iniciado sesión
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Libro no encontrado" });
  }
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: "No tienes ninguna reseña en este libro" });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review for ISBN ${isbn} deleted`,
    reviews: books[isbn].reviews,
});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;