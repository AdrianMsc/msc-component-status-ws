import sql from "../config/db.js";

export const getAllNames = async () => {
  const query = "SELECT c.name FROM component c ORDER BY c.name;";
  return await sql(query);
};

export const getCount = async () => {
  const query = "SELECT COUNT(*) FROM component;";
  const [result] = await sql(query);
  return Number(result.count);
};

export const getAllWithDetails = async () => {
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
  return await sql(query);
};

export const create = async ({
  name,
  category,
  comment,
  description,
  imageUrl,
  atomicType,
}) => {
  const result = await sql(
    `INSERT INTO component (name, category, comment, description, image, atomic_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
    [name, category, comment, description, imageUrl, atomicType]
  );
  return result[0]?.id;
};

export const createStatuses = async ({
  componentId,
  figma,
  guidelines,
  cdn,
  storybook,
}) => {
  await sql(
    `INSERT INTO statuses (comp_id, figma, guidelines, cdn, storybook)
       VALUES ($1, $2, $3, $4, $5)`,
    [componentId, figma, guidelines, cdn, storybook]
  );
};

export const createPlatformLinks = async ({
  componentId,
  figmaLink,
  storybookLink,
}) => {
  await sql(
    `INSERT INTO platform_links (comp_id, figma, storybook)
       VALUES ($1, $2, $3)`,
    [componentId, figmaLink, storybookLink]
  );
};

export const findById = async (id) => {
  const [component] = await sql`
        SELECT * FROM component WHERE id = ${id}
      `;
  return component;
};

export const update = async (
  id,
  { name, category, comment, description, image, atomicType }
) => {
  const updateQuery = image
    ? `UPDATE component
         SET name = $1, category = $2, comment = $3, description = $4, image = $5, atomic_type = $6
         WHERE id = $7
         RETURNING id`
    : `UPDATE component
         SET name = $1, category = $2, comment = $3, description = $4, atomic_type = $5
         WHERE id = $6
         RETURNING id`;

  const updateParams = image
    ? [name, category, comment, description, image, atomicType, id]
    : [name, category, comment, description, atomicType, id];

  const result = await sql(updateQuery, updateParams);
  return result.length > 0;
};

export const upsertStatuses = async (
  id,
  { figma, guidelines, cdn, storybook }
) => {
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
};

export const upsertPlatformLinks = async (id, { figmaLink, storybookLink }) => {
  const [links] = await sql`SELECT * FROM platform_links WHERE comp_id = ${id}`;
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
};

export const updateStatusFields = async (
  id,
  { figma, guidelines, cdn, storybook }
) => {
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
};

export const updatePlatformLinkFields = async (
  id,
  { figmaLink, storybookLink }
) => {
  await sql(
    `UPDATE platform_links 
         SET 
          figma = COALESCE($1, figma),
          storybook = COALESCE($2, storybook)
         WHERE comp_id = $3`,
    [figmaLink, storybookLink, id]
  );
};

export const deleteById = async (id) => {
  const result = await sql`
      WITH deleted_component AS (
        DELETE FROM component WHERE id = ${id} RETURNING id
      )
      DELETE FROM statuses WHERE comp_id IN (SELECT id FROM deleted_component);
    `;
  // Postgres returns array for simple queries, checking both just in case depending on driver result
  // The original code checked result.count and result.rowCount
  return result;
};
