const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// ---------- Registro ----------
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Faltan usuario o contraseña" });
  }
  if (isValid(username)) {
    return res.status(409).json({ message: "El usuario ya existe" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "Usuario registrado correctamente. Ya puedes iniciar sesión" });
});

// ---------- Rutas internas de datos (las consume Axios) ----------
public_users.get("/api/books", (req, res) => {
  res.json(books);
});

public_users.get("/api/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  res.json(book);
});

public_users.get("/api/author/:author", (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.entries(books)
    .filter(([isbn, book]) => book.author.toLowerCase() === author)
    .map(([isbn, book]) => ({ isbn, ...book }));
  if (result.length === 0) return res.status(404).json({ message: "No hay libros de ese autor" });
  res.json(result);
});

public_users.get("/api/title/:title", (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.entries(books)
    .filter(([isbn, book]) => book.title.toLowerCase() === title)
    .map(([isbn, book]) => ({ isbn, ...book }));
  if (result.length === 0) return res.status(404).json({ message: "No hay libros con ese título" });
  res.json(result);
});

// ---------- Rutas públicas con Axios + async/await ----------
public_users.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/books`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener los libros" });
  }
});

public_users.get("/isbn/:isbn", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/isbn/${req.params.isbn}`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    return res.status(status).json({ message: "No se pudo obtener el libro por ISBN" });
  }
});

public_users.get("/author/:author", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/author/${encodeURIComponent(req.params.author)}`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    return res.status(status).json({ message: "No se pudo obtener los libros por autor" });
  }
});

public_users.get("/title/:title", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/title/${encodeURIComponent(req.params.title)}`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    return res.status(status).json({ message: "No se pudo obtener los libros por título" });
  }
});

// Reseñas de un libro
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;