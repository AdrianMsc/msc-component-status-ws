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
        c.description,
        cat.id AS category_id,
        cat.name AS category_name,
        s.name AS status_name,
        p.name AS platform_name
    FROM 
        component c
    JOIN 
        category cat ON c.category_id = cat.id
    JOIN 
        component_status cs ON cs.component_id = c.id
    JOIN 
        stage s ON s.id = cs.stage_id
    JOIN 
        platform p ON p.id = cs.platform_id
    ORDER BY 
        c.id, cs.stage_id, cs.platform_id;
    `;

    const rows = await sql(query);

    // Agrupar los componentes por categoría
    const result = rows.reduce((acc, row) => {
      // Busca la categoría en el acumulador
      let category = acc.find((c) => c.category === row.category_name);
      if (!category) {
        category = { category: row.category_name, components: [] };
        acc.push(category);
      }

      // Busca el componente en la categoría
      let component = category.components.find(
        (c) => c.id === row.component_id
      );
      if (!component) {
        component = {
          id: row.component_id,
          name: row.component_name,
          statuses: [],
          comment: row.description,
        };
        category.components.push(component);
      }

      // Agregar el estado y plataforma si no están ya en la lista
      const existingStatus = component.statuses.find(
        (s) => s.platform === row.platform_name && s.status === row.status_name
      );
      if (!existingStatus) {
        component.statuses.push({
          platform: row.platform_name,
          status: row.status_name,
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
// app.post("/categories/:category/components", async (req, res) => {
//   const { category } = req.params;
//   const { name, description } = req.body;
//   try {
//     const categoryResult = await sql`
//       SELECT id FROM category WHERE name = ${category};
//     `;
//     if (categoryResult.length > 0) {
//       const categoryId = categoryResult[0].id;
//       const response = await sql`
//         INSERT INTO component (name, description, category_id) VALUES (${name}, ${description}, ${categoryId}) RETURNING *;
//       `;
//       res.status(201).json(response[0]);
//     } else {
//       res.status(404).send("Category not found");
//     }
//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/categories/:category/components", async (req, res) => {
  const { category } = req.params;
  const { name, comment } = req.body;

  try {
    // Obtener el ID de la categoría
    const categoryResult = await sql`
      SELECT id FROM category WHERE name = ${category};
    `;

    if (categoryResult.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const categoryId = categoryResult[0].id;

    // Verificar si el componente ya existe en la categoría
    const existingComponent = await sql`
      SELECT * FROM component WHERE name = ${name} AND category_id = ${categoryId};
    `;

    if (existingComponent.length > 0) {
      return res.status(409).json({ message: "Component already exists" });
    }

    // Insertar el nuevo componente
    const response = await sql`
      INSERT INTO component (name, comment, category_id)
      VALUES (${name}, ${comment}, ${categoryId})
      RETURNING *;
    `;

    res.status(201).json(response[0]);
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
