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
    const query = `
     SELECT 
    c.id AS component_id,
    c.name AS component_name,
    c.category AS component_category,
    c.comment AS component_comment,
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
  const { name, comment, figma, guidelines, cdn, storybook } = req.body;

  if (!name || !comment) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  try {
    const componentResult = await sql(
      "INSERT INTO component (name, category, comment) VALUES ($1, $2, $3) RETURNING id",
      [name, category, comment]
    );

    const componentId = componentResult[0].id;

    await sql(
      "INSERT INTO statuses (comp_id, figma, guidelines, cdn, storybook) VALUES ($1, $2, $3, $4, $5)",
      [componentId, figma, guidelines, cdn, storybook]
    );

    res
      .status(201)
      .json({ message: "Componente creado exitosamente", componentId });
  } catch (error) {
    console.error("Error al insertar componente:", error);
    res.status(500).json({ error: "Error al insertar componente" });
  }
});

// Create a new category
app.post("/categories", async (req, res) => {});

// Update a component
app.put("/components/:category/:id", async (req, res) => {});

// Delete a component
app.delete("/components/:category/:id", async (req, res) => {});

// Delete a category
app.delete("/categories/:category", async (req, res) => {});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});
