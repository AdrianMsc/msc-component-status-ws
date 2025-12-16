import sql from "../config/db.js";
import {
  deleteImageFromS3,
  uploadCompressedImage,
  overwriteImage,
} from "../services/s3Service.js";
import { extractS3KeyFromUrl } from "../utils/s3Helpers.js";

export const handshake = async (_, res) => {
  await res.json("👍");
};

export const getAllComponentNames = async (_, res) => {
  try {
    const query = "SELECT c.name FROM component c ORDER BY c.name;";
    const components = await sql(query);
    res.json(components);
  } catch (error) {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getComponentCount = async (_, res) => {
  try {
    const query = "SELECT COUNT(*) FROM component;";
    const [result] = await sql(query);
    res.json({ count: Number(result.count) });
  } catch (error) {
    console.error("Error counting components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllComponents = async (_, res) => {
  try {
    const query = `
     SELECT 
          c.id AS component_id,
          c.name AS component_name,
          c.category AS component_category,
          c.atomic_type AS component_atomic_type,
          c.comment AS component_comment,
          c.description AS component_description,
          c.image AS component_image,
          c.created_at AS component_creation,
          c.updated_at AS component_update,
          c.atomic_type AS component_atomic_type,
          pl.figma AS figma_link,
          pl.storybook AS storybook_link,
          s.guidelines AS component_guidelines,  
          s.figma AS component_figma,
          s.storybook AS component_storybook,
          s.cdn AS component_cdn
      FROM 
          component c
      LEFT JOIN 
          statuses s ON c.id = s.comp_id
      LEFT JOIN 
          platform_links pl ON c.id = pl.comp_id   
      ORDER BY
          c.id;
    `;
    const rows = await sql(query);

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
          atomicType: row.component_atomic_type,
          comment: row.component_comment,
          image: row.component_image,
          createdAt: row.component_creation,
          updatedAt: row.component_update,
          statuses: [],
          storybookLink: row.storybook_link,
          figmaLink: row.figma_link,
        };
        category.components.push(component);
      }

      component.statuses.push({
        guidelines: row.component_guidelines,
        figma: row.component_figma,
        storybook: row.component_storybook,
        cdn: row.component_cdn,
      });

      return acc;
    }, []);

    res.json(result);
  } catch (error) {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createComponent = async (req, res) => {
  const { category } = req.params;
  const {
    name,
    comment = "",
    description = "",
    atomicType = "",
    figma = "",
    figmaLink = "",
    guidelines = "",
    cdn = "",
    storybook = "",
    storybookLink = "",
  } = req.body;

  if (!name?.trim() || !category?.trim()) {
    return res
      .status(400)
      .json({ error: "Required fields: name and category." });
  }

  try {
    let imageUrl = null;

    if (req.file) {
      const { buffer, mimetype, size } = req.file;

      if (!mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files are allowed." });
      }

      const maxSize = 5 * 1024 * 1024;
      if (size > maxSize) {
        return res.status(400).json({ error: "Image size exceeds 5MB." });
      }

      imageUrl = await uploadCompressedImage(buffer, name);
    }

    const componentResult = await sql(
      `INSERT INTO component (name, category, comment, description, image, atomic_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, category, comment, description, imageUrl, atomicType]
    );

    const componentId = componentResult[0]?.id;
    if (!componentId) {
      throw new Error("Component ID not retrieved after insert.");
    }

    await sql(
      `INSERT INTO statuses (comp_id, figma, guidelines, cdn, storybook)
       VALUES ($1, $2, $3, $4, $5)`,
      [componentId, figma, guidelines, cdn, storybook]
    );

    await sql(
      `INSERT INTO platform_links (comp_id, figma, storybook)
       VALUES ($1, $2, $3)`,
      [componentId, figmaLink, storybookLink]
    );

    res.status(201).json({
      message: "Component created successfully.",
      componentId,
      imageUrl,
    });
  } catch (error) {
    console.error("Error creating component:", error.message);
    res.status(500).json({
      error: "An error occurred while creating the component.",
    });
  }
};

export const updateComponent = async (req, res) => {
  const { category, id } = req.params;

  const {
    name,
    comment,
    description,
    atomicType,
    figma,
    guidelines,
    cdn,
    storybook,
    figmaLink,
    storybookLink,
  } = req.body;

  if (!name || !category || !id) {
    return res
      .status(400)
      .json({ error: "Required fields: name, category, and id." });
  }

  try {
    let imageKey;

    if (req.file) {
      const [existingComponent] = await sql`
        SELECT image FROM component WHERE id = ${id}
      `;
      const previousUrl = existingComponent?.image;

      if (previousUrl) {
        const actualKey = extractS3KeyFromUrl(previousUrl);
        await overwriteImage(req.file.buffer, actualKey);
        imageKey = previousUrl;
      } else {
        imageKey = await uploadCompressedImage(req.file.buffer, name);
      }
    }

    const updateQuery = imageKey
      ? `UPDATE component
         SET name = $1, category = $2, comment = $3, description = $4, image = $5, atomic_type = $6
         WHERE id = $7
         RETURNING id`
      : `UPDATE component
         SET name = $1, category = $2, comment = $3, description = $4, atomic_type = $5
         WHERE id = $6
         RETURNING id`;

    const updateParams = imageKey
      ? [name, category, comment, description, imageKey, atomicType, id]
      : [name, category, comment, description, atomicType, id];

    const componentResult = await sql(updateQuery, updateParams);

    if (componentResult.length === 0) {
      return res.status(404).json({ error: "Component not found." });
    }

    const [status] = await sql`SELECT * FROM statuses WHERE comp_id = ${id}`;
    if (status) {
      await sql`
        UPDATE statuses SET figma = ${figma}, guidelines = ${guidelines}, cdn = ${cdn}, storybook = ${storybook}
        WHERE comp_id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO statuses (comp_id, figma, guidelines, cdn, storybook)
        VALUES (${id}, ${figma}, ${guidelines}, ${cdn}, ${storybook})
      `;
    }

    const [links] =
      await sql`SELECT * FROM platform_links WHERE comp_id = ${id}`;
    if (links) {
      await sql`
        UPDATE platform_links SET figma = ${figmaLink}, storybook = ${storybookLink}
        WHERE comp_id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO platform_links (comp_id, figma, storybook)
        VALUES (${id}, ${figmaLink}, ${storybookLink})
      `;
    }

    return res.status(200).json({
      message: "Component, statuses, and platform links updated successfully.",
    });
  } catch (error) {
    console.error("Error updating component:", error);
    return res.status(500).json({
      error: "An error occurred while updating the component.",
    });
  }
};

export const updateComponentResources = async (req, res) => {
  const { id } = req.params;
  const { figma, guidelines, cdn, storybook, figmaLink, storybookLink } =
    req.body;

  try {
    let statusUpdated = false;
    let linksUpdated = false;

    if (
      figma !== undefined ||
      guidelines !== undefined ||
      cdn !== undefined ||
      storybook !== undefined
    ) {
      await sql(
        `UPDATE statuses 
         SET 
          figma = COALESCE($1, figma),
          guidelines = COALESCE($2, guidelines),
          cdn = COALESCE($3, cdn),
          storybook = COALESCE($4, storybook)
         WHERE comp_id = $5`,
        [figma, guidelines, cdn, storybook, id]
      );
      statusUpdated = true;
    }

    if (figmaLink !== undefined || storybookLink !== undefined) {
      await sql(
        `UPDATE platform_links 
         SET 
          figma = COALESCE($1, figma),
          storybook = COALESCE($2, storybook)
         WHERE comp_id = $3`,
        [figmaLink, storybookLink, id]
      );
      linksUpdated = true;
    }

    if (!statusUpdated && !linksUpdated) {
      return res.status(400).json({
        error: "No valid fields provided to update.",
      });
    }

    res.status(200).json({
      message: "Component resources updated successfully.",
      updated: {
        statuses: statusUpdated,
        links: linksUpdated,
      },
    });
  } catch (error) {
    console.error("Error updating component resources:", error.message);
    res.status(500).json({ error: "Error updating component resources" });
  }
};

export const deleteComponent = async (req, res) => {
  const { id } = req.params;

  try {
    const [component] = await sql`
      SELECT image FROM component WHERE id = ${id}
    `;

    if (!component) {
      return res.status(404).json({ message: "Component not found." });
    }

    const imageUrl = component.image;

    if (imageUrl) {
      try {
        const s3Key = imageUrl.split(".amazonaws.com/")[1];
        if (s3Key) {
          await deleteImageFromS3(s3Key);
        }
      } catch (s3Err) {
        console.warn("Failed to delete image from S3:", s3Err.message);
      }
    }

    const result = await sql`
      WITH deleted_component AS (
        DELETE FROM component WHERE id = ${id} RETURNING id
      )
      DELETE FROM statuses WHERE comp_id IN (SELECT id FROM deleted_component);
    `;

    if (result.count === 0 && result.rowCount === 0) {
      return res.status(404).json({
        message: "Component not found or could not be erased.",
      });
    }

    res.status(200).json({
      message: "Component, related records, and image erased successfully.",
    });
  } catch (err) {
    console.error("Error erasing component:", err);
    res.status(500).json({ message: "Error erasing component." });
  }
};
