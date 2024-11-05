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

// Create a new element
app.post("/elements", (req, res) => {
  const elements = readData();
  const nuevoElemento = req.body;
  nuevoElemento.id = elements.length + 1;
  elements.push(nuevoElemento);
  writeData(elements);
  res.status(201).json(nuevoElemento);
});

// Read all elements
app.get("/elements", (req, res) => {
  const elements = readData();
  res.json(elements);
});

// Update an element
app.put("/elements/:id", (req, res) => {
  const elements = readData();
  const id = parseInt(req.params.id);
  const index = elements.findIndex((e) => e.id === id);
  if (index !== -1) {
    elements[index] = { ...elements[index], ...req.body };
    writeData(elements);
    res.json(elements[index]);
  } else {
    res.status(404).send("Element not found");
  }
});

// Delete an element
app.delete("/elements/:id", (req, res) => {
  let elements = readData();
  const id = parseInt(req.params.id);
  elements = elements.filter((e) => e.id !== id);
  writeData(elements);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
