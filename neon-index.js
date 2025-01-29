require("dotenv").config();

const express = require("express");
const { neon } = require("@neondatabase/serverless");

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.json());

const sql = neon(`${process.env.DATABASE_URL}`);

// Read all components
app.get("/components", async (_, res) => {
  try {
    const response = await sql`
      SELECT 
        c.id AS component_id,
        c.name AS component_name,
        c.description,
        cat.id AS category_id,
        cat.name AS category_name
      FROM 
        component c
      JOIN 
        category cat ON c.category_id = cat.id;
    `;
    res.json(response);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new category
app.post("/categories", async (req, res) => {
  const { name } = req.body;
  try {
    const response = await sql`
      INSERT INTO category (name) VALUES (${name}) RETURNING *;
    `;
    res.status(201).json(response[0]);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new component within a category
app.post("/categories/:category/components", async (req, res) => {
  const { category } = req.params;
  const { name, description } = req.body;
  try {
    const categoryResult = await sql`
      SELECT id FROM category WHERE name = ${category};
    `;
    if (categoryResult.length > 0) {
      const categoryId = categoryResult[0].id;
      const response = await sql`
        INSERT INTO component (name, description, category_id) VALUES (${name}, ${description}, ${categoryId}) RETURNING *;
      `;
      res.status(201).json(response[0]);
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a component
app.put("/components/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  const { name, description } = req.body;
  try {
    const categoryResult = await sql`
      SELECT id FROM category WHERE name = ${category};
    `;
    if (categoryResult.length > 0) {
      const categoryId = categoryResult[0].id;
      const response = await sql`
        UPDATE component SET name = ${name}, description = ${description}, category_id = ${categoryId} WHERE id = ${id} RETURNING *;
      `;
      if (response.length > 0) {
        res.json(response[0]);
      } else {
        res.status(404).send("Component not found");
      }
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a component
app.delete("/components/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  try {
    const categoryResult = await sql`
      SELECT id FROM category WHERE name = ${category};
    `;
    if (categoryResult.length > 0) {
      const categoryId = categoryResult[0].id;
      const response = await sql`
        DELETE FROM component WHERE id = ${id} AND category_id = ${categoryId} RETURNING *;
      `;
      if (response.length > 0) {
        res.status(204).send();
      } else {
        res.status(404).send("Component not found");
      }
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a category
app.delete("/categories/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const response = await sql`
      DELETE FROM category WHERE name = ${category} RETURNING *;
    `;
    if (response.length > 0) {
      res.status(200).json(response[0]);
    } else {
      res.status(404).send("Category not found");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});
