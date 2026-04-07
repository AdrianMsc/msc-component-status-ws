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
    [name, category, comment, description, imageUrl, atomicType],
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
    [componentId, figma, guidelines, cdn, storybook],
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
    [componentId, figmaLink, storybookLink],
  );
};

export const findById = async (id) => {
  const [component] = await sql`
        SELECT * FROM component WHERE id = ${id}
      `;
  return component;
};

export const findByIdWithRelations = async (id) => {
  const query = `
    SELECT
      c.id,
      c.name,
      c.category,
      c.atomic_type,
      c.comment,
      c.description,
      c.image,
      c.created_at,
      c.updated_at,
      s.figma,
      s.guidelines,
      s.cdn,
      s.storybook,
      pl.figma AS figma_link,
      pl.storybook AS storybook_link
    FROM component c
    LEFT JOIN statuses s ON s.comp_id = c.id
    LEFT JOIN platform_links pl ON pl.comp_id = c.id
    WHERE c.id = $1
    LIMIT 1
  `;

  const [component] = await sql(query, [id]);
  return component;
};

export const update = async (
  id,
  { name, category, comment, description, image, atomicType },
) => {
  const shouldUpdateImage = image !== undefined;
  const updateQuery = shouldUpdateImage
    ? `UPDATE component
         SET name = $1, category = $2, comment = $3, description = $4, image = $5, atomic_type = $6
         WHERE id = $7
         RETURNING id`
    : `UPDATE component
         SET name = $1, category = $2, comment = $3, description = $4, atomic_type = $5
         WHERE id = $6
         RETURNING id`;

  const updateParams = shouldUpdateImage
    ? [name, category, comment, description, image, atomicType, id]
    : [name, category, comment, description, atomicType, id];

  const result = await sql(updateQuery, updateParams);
  return result.length > 0;
};

export const updateImageById = async (id, imageUrl) => {
  const normalizedId = Number(id);
  const result = await sql(
    `UPDATE component
         SET image = $1
         WHERE id = $2
         RETURNING id`,
    [imageUrl, normalizedId],
  );
  return result.length > 0;
};

export const upsertStatuses = async (
  id,
  { figma, guidelines, cdn, storybook },
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
  { figma, guidelines, cdn, storybook },
) => {
  await sql(
    `UPDATE statuses 
         SET 
          figma = COALESCE($1, figma),
          guidelines = COALESCE($2, guidelines),
          cdn = COALESCE($3, cdn),
          storybook = COALESCE($4, storybook)
         WHERE comp_id = $5`,
    [figma, guidelines, cdn, storybook, id],
  );
};

export const updatePlatformLinkFields = async (
  id,
  { figmaLink, storybookLink },
) => {
  await sql(
    `UPDATE platform_links 
         SET 
          figma = COALESCE($1, figma),
          storybook = COALESCE($2, storybook)
         WHERE comp_id = $3`,
    [figmaLink, storybookLink, id],
  );
};

export const deleteById = async (id) => {
  const deleted = await sql(`DELETE FROM component WHERE id = $1 RETURNING id`, [id]);

  if (!deleted.length) {
    return { rowCount: 0 };
  }

  await sql(`DELETE FROM statuses WHERE comp_id = $1`, [id]);
  await sql(`DELETE FROM platform_links WHERE comp_id = $1`, [id]);
  await sql(`DELETE FROM component_versions WHERE component_id = $1`, [id]);

  return { rowCount: deleted.length };
};

// ============================================
// Version CRUD Operations
// ============================================

export const createVersion = async ({ componentId, version }) => {
  // First, unset is_latest for all versions of this component
  await sql`UPDATE component_versions SET is_latest = false WHERE component_id = ${componentId}`;
  
  // Insert the new version
  const result = await sql`
    INSERT INTO component_versions (component_id, version, is_latest)
    VALUES (${componentId}, ${version}, true)
    RETURNING id, component_id, version, is_latest, created_at
  `;
  
  // Update component's current_version
  await sql`UPDATE component SET current_version = ${version} WHERE id = ${componentId}`;
  
  return result[0];
};

export const getVersionsByComponent = async (componentId) => {
  const result = await sql`
    SELECT id, component_id, version, is_latest, created_at
    FROM component_versions
    WHERE component_id = ${componentId}
    ORDER BY created_at DESC
  `;
  return result;
};

export const getLatestVersion = async (componentId) => {
  const [result] = await sql`
    SELECT id, component_id, version, is_latest, created_at
    FROM component_versions
    WHERE component_id = ${componentId} AND is_latest = true
    LIMIT 1
  `;
  return result;
};

export const getVersionById = async (versionId) => {
  const [result] = await sql`
    SELECT id, component_id, version, is_latest, created_at
    FROM component_versions
    WHERE id = ${versionId}
    LIMIT 1
  `;
  return result;
};

export const updateVersion = async (versionId, { version }) => {
  const [updated] = await sql`
    UPDATE component_versions
    SET version = ${version}
    WHERE id = ${versionId}
    RETURNING id, component_id, version, is_latest, created_at
  `;
  
  // If this version is marked as latest, update component's current_version
  if (updated) {
    const [versionData] = await sql`
      SELECT component_id FROM component_versions WHERE id = ${versionId}
    `;
    if (versionData) {
      await sql`UPDATE component SET current_version = ${version} WHERE id = ${versionData.component_id}`;
    }
  }
  
  return updated;
};

export const deleteVersion = async (versionId) => {
  // Get the version to delete first
  const [versionToDelete] = await sql`
    SELECT component_id, is_latest FROM component_versions WHERE id = ${versionId}
  `;
  
  if (!versionToDelete) {
    return { rowCount: 0 };
  }
  
  const deleted = await sql`DELETE FROM component_versions WHERE id = ${versionId} RETURNING id`;
  
  // If we deleted the latest version, set the most recent one as latest
  if (versionToDelete.is_latest) {
    const [newLatest] = await sql`
      UPDATE component_versions
      SET is_latest = true
      WHERE component_id = ${versionToDelete.component_id}
      AND id = (
        SELECT id FROM component_versions
        WHERE component_id = ${versionToDelete.component_id}
        ORDER BY created_at DESC
        LIMIT 1
      )
      RETURNING id, component_id, version, is_latest, created_at
    `;
    
    if (newLatest) {
      await sql`UPDATE component SET current_version = ${newLatest.version} WHERE id = ${versionToDelete.component_id}`;
    }
  }
  
  return { rowCount: deleted.length };
};

export const setLatestVersion = async (versionId) => {
  // Get the component_id for this version
  const [versionData] = await sql`
    SELECT component_id FROM component_versions WHERE id = ${versionId}
  `;
  
  if (!versionData) {
    return null;
  }
  
  // Unset all is_latest for this component
  await sql`
    UPDATE component_versions
    SET is_latest = false
    WHERE component_id = ${versionData.component_id}
  `;
  
  // Set this version as latest
  const [updated] = await sql`
    UPDATE component_versions
    SET is_latest = true
    WHERE id = ${versionId}
    RETURNING id, component_id, version, is_latest, created_at
  `;
  
  // Update component's current_version
  if (updated) {
    await sql`
      UPDATE component
      SET current_version = ${updated.version}
      WHERE id = ${versionData.component_id}
    `;
  }
  
  return updated;
};

export const getAllComponentsWithVersions = async () => {
  const query = `
    SELECT 
      c.id AS component_id,
      c.name AS component_name,
      c.category AS component_category,
      c.atomic_type AS component_atomic_type,
      c.comment AS component_comment,
      c.description AS component_description,
      c.image AS component_image,
      c.current_version AS component_version,
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

export const findByIdWithVersion = async (id, versionId = null) => {
  let query;
  let params;
  
  if (versionId) {
    query = `
      SELECT
        c.id,
        c.name,
        c.category,
        c.atomic_type,
        c.comment,
        c.description,
        c.image,
        c.current_version,
        c.created_at,
        c.updated_at,
        s.figma,
        s.guidelines,
        s.cdn,
        s.storybook,
        pl.figma AS figma_link,
        pl.storybook AS storybook_link,
        cv.id AS version_id,
        cv.version,
        cv.is_latest
      FROM component c
      LEFT JOIN statuses s ON s.comp_id = c.id
      LEFT JOIN platform_links pl ON pl.comp_id = c.id
      LEFT JOIN component_versions cv ON cv.component_id = c.id
      WHERE c.id = $1 AND cv.id = $2
      LIMIT 1
    `;
    params = [id, versionId];
  } else {
    query = `
      SELECT
        c.id,
        c.name,
        c.category,
        c.atomic_type,
        c.comment,
        c.description,
        c.image,
        c.current_version,
        c.created_at,
        c.updated_at,
        s.figma,
        s.guidelines,
        s.cdn,
        s.storybook,
        pl.figma AS figma_link,
        pl.storybook AS storybook_link,
        cv.id AS version_id,
        cv.version,
        cv.is_latest
      FROM component c
      LEFT JOIN statuses s ON s.comp_id = c.id
      LEFT JOIN platform_links pl ON pl.comp_id = c.id
      LEFT JOIN component_versions cv ON cv.component_id = c.id AND cv.is_latest = true
      WHERE c.id = $1
      LIMIT 1
    `;
    params = [id];
  }

  const [component] = await sql(query, params);
  return component;
};
