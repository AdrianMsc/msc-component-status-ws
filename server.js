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

// Create a new component
app.post("/components", (req, res) => {
  const data = readData();
  const { category, component } = req.body;
  const categoryIndex = data.findIndex((c) => c.category === category);

  if (categoryIndex !== -1) {
    const newComponent = {
      ...component,
      id: data[categoryIndex].components.length + 1,
    };
    data[categoryIndex].components.push(newComponent);
    writeData(data);
    res.status(201).json(newComponent);
  } else {
    res.status(404).send("Category not found");
  }
});

// Read all components
app.get("/components", (req, res) => {
  const data = readData();
  res.json(data);
});

// Update a component
app.put("/components/:category/:id", (req, res) => {
  const data = readData();
  const { category, id } = req.params;
  const categoryIndex = data.findIndex((c) => c.category === category);

  if (categoryIndex !== -1) {
    const componentIndex = data[categoryIndex].components.findIndex(
      (c) => c.id === parseInt(id)
    );
    if (componentIndex !== -1) {
      data[categoryIndex].components[componentIndex] = {
        ...data[categoryIndex].components[componentIndex],
        ...req.body,
      };
      writeData(data);
      res.json(data[categoryIndex].components[componentIndex]);
    } else {
      res.status(404).send("Component not found");
    }
  } else {
    res.status(404).send("Category not found");
  }
});

// Delete a component
app.delete("/components/:category/:id", (req, res) => {
  const data = readData();
  const { category, id } = req.params;
  const categoryIndex = data.findIndex((c) => c.category === category);

  if (categoryIndex !== -1) {
    data[categoryIndex].components = data[categoryIndex].components.filter(
      (c) => c.id !== parseInt(id)
    );
    writeData(data);
    res.status(204).send();
  } else {
    res.status(404).send("Category not found");
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
