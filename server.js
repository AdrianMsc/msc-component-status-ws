const express = require("express");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const readData = () => {
  const data = fs.readFileSync("data.json");
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
};

// Crear un nuevo elemento
app.post("/elementos", (req, res) => {
  const elementos = readData();
  const nuevoElemento = req.body;
  nuevoElemento.id = elementos.length + 1;
  elementos.push(nuevoElemento);
  writeData(elementos);
  res.status(201).json(nuevoElemento);
});

// Leer todos los elementos
app.get("/elementos", (req, res) => {
  const elementos = readData();
  res.json(elementos);
});

// Actualizar un elemento
app.put("/elementos/:id", (req, res) => {
  const elementos = readData();
  const id = parseInt(req.params.id);
  const index = elementos.findIndex((e) => e.id === id);
  if (index !== -1) {
    elementos[index] = { ...elementos[index], ...req.body };
    writeData(elementos);
    res.json(elementos[index]);
  } else {
    res.status(404).send("Elemento no encontrado");
  }
});

// Borrar un elemento
app.delete("/elementos/:id", (req, res) => {
  let elementos = readData();
  const id = parseInt(req.params.id);
  elementos = elementos.filter((e) => e.id !== id);
  writeData(elementos);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
