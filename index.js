require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();
const PORT = process.env.PORT || 4242;

app.use(express.json());
app.use(cors());

const sql = neon(`${process.env.DATABASE_URL}`);

app.get("/handshake", async (_, res) => {
  await res.json("👍");
});

app.get("/allcomponents", async (_, res) => {
  try {
    const query = `
    SELECT 
    c.name
    FROM 
    component c
    ORDER BY
    c.name;
    `;

    const components = await sql(query);
    await res.json(components);
  } catch {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Read all components
app.get("/components", async (_, res) => {
  try {
    const query = `
     SELECT 
    c.id AS component_id,
    c.name AS component_name,
    c.category AS component_category,
    c.comment AS component_comment,
    c.description AS component_description,
    s.guidelines AS component_guidelines,  
    s.figma AS component_figma,
    s.storybook AS component_storybook,
    s.cdn AS component_cdn
    FROM 
        component c
    LEFT JOIN 
        statuses s ON c.id = s.comp_id
    ORDER BY
        c.id;
 
    `;

    const rows = await sql(query);

    // Agrupar los componentes por categoría
    const result = rows.reduce((acc, row) => {
      let category = acc.find((c) => c.category === row.component_category);
      if (!category) {
        category = { category: row.component_category, components: [] };
        acc.push(category);
      }

      let component = category.components.find(
        (c) => c.id === row.component_id
      );

      if (!component) {
        component = {
          id: row.component_id,
          name: row.component_name,
          description: row.component_description,
          category: category.category,
          comment: row.component_comment,
          statuses: [
            {
              guideline_id: row.guideline_id,
              guidelines: row.component_guidelines,
              figma: row.component_figma,
              storybook: row.component_storybook,
              cdn: row.component_cdn,
            },
          ],
        };
        category.components.push(component);
      } else {
        component.statuses.push({
          guideline_id: row.guideline_id,
          guidelines: row.component_guidelines,
          figma: row.component_figma,
          storybook: row.component_storybook,
          cdn: row.component_cdn,
        });
      }

      return acc;
    }, []);

    res.json(result);
  } catch (error) {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new component within a category

app.post("/categories/:category/components", async (req, res) => {
  const { category } = req.params;
  const { name, comment, description, figma, guidelines, cdn, storybook } =
    req.body;

  if (!name) {
    return res.status(400).json({ error: "Required data incomplete." });
  }

  try {
    const componentResult = await sql(
      "INSERT INTO component (name, category, comment, description) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, category, comment, description]
    );

    const componentId = componentResult[0].id;

    await sql(
      "INSERT INTO statuses (comp_id, figma, guidelines, cdn, storybook) VALUES ($1, $2, $3, $4, $5)",
      [componentId, figma, guidelines, cdn, storybook]
    );

    res
      .status(201)
      .json({ message: "Component created successfully", componentId });
  } catch (error) {
    console.error("Error al insertar componente:", error);
    res.status(500).json({ error: "Error creating component" });
  }
});

// Update a component
app.put("/categories/:category/components/:id", async (req, res) => {
  const { category, id } = req.params;
  const { name, comment, description, figma, guidelines, cdn, storybook } =
    req.body;

  if (!name) {
    return res.status(400).json({ error: "Required data incomplete." });
  }

  try {
    const componentResult = await sql(
      "UPDATE component SET name = $1, category = $2, comment = $3, description = $4 WHERE id = $5 RETURNING id",
      [name, category, comment, description, id]
    );

    if (componentResult.length === 0) {
      return res.status(404).json({ error: "Component not found." });
    }

    await sql(
      "UPDATE statuses SET figma = $1, guidelines = $2, cdn = $3, storybook = $4 WHERE comp_id = $5",
      [figma, guidelines, cdn, storybook, id]
    );

    res
      .status(200)
      .json({ message: "Component and statuses updated successfully" });
  } catch (error) {
    console.error("Error updating component and statuses:", error);
    res.status(500).json({ error: "Error updating component and statuses" });
  }
});

// Delete a component
app.delete("/components/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos category y id de la URL

  try {
    const result = await sql`
      WITH ins_component AS (
        DELETE FROM component
        WHERE id = ${id}
        RETURNING id
      )
      DELETE FROM statuses
      WHERE comp_id IN (SELECT id FROM ins_component);
    `;

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Component not found or could not be erased." });
    }

    res.status(200).json({
      message: "Component and registers erased successfully.",
    });
  } catch (err) {
    console.error("Error erasing component:", err);
    res.status(500).json({ message: "Error erasing component." });
  }
});

// Create a new category
// app.post("/categories", async (req, res) => {});

// Delete a category
// app.delete("/categories/:category", async (req, res) => {});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});
