import * as ComponentModel from "../models/component.model.js";
import { del, put } from "@vercel/blob";
import { convertImageBufferToWebp } from "../utils/imageToWebp.js";

export const getComponentNames = async () => {
  return await ComponentModel.getAllNames();
};

export const getComponentCount = async () => {
  return await ComponentModel.getCount();
};

export const getFormattedComponents = async () => {
  const rows = await ComponentModel.getAllWithDetails();

  return rows.reduce((acc, row) => {
    let category = acc.find((c) => c.category === row.component_category);
    if (!category) {
      category = { category: row.component_category, components: [] };
      acc.push(category);
    }

    let component = category.components.find((c) => c.id === row.component_id);
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
};

export const createNewComponent = async (data) => {
  const componentId = await ComponentModel.create({
    ...data,
    imageUrl: null,
  });

  if (!componentId) {
    throw new Error("Component ID not retrieved after insert.");
  }

  await ComponentModel.createStatuses({
    componentId,
    ...data,
  });

  await ComponentModel.createPlatformLinks({
    componentId,
    ...data,
  });

  if (data?.imageFile) {
    const { buffer, contentType, extension } = await convertImageBufferToWebp(
      data.imageFile.buffer,
    );
    const pathname = `components/${componentId}/${Date.now()}.${extension}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
    });

    await ComponentModel.updateImageById(componentId, blob.url);
  }

  return { componentId };
};

export const modifyComponent = async (id, data) => {
  const existing = await ComponentModel.findById(id);

  const updated = await ComponentModel.update(id, {
    ...data,
  });

  if (!updated) {
    throw new Error("Component not found.");
  }

  await ComponentModel.upsertStatuses(id, data);
  await ComponentModel.upsertPlatformLinks(id, data);

  if (data?.imageFile) {
    const { buffer, contentType, extension } = await convertImageBufferToWebp(
      data.imageFile.buffer,
    );
    const pathname = `components/${id}/${Date.now()}.${extension}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
    });

    const imageUpdated = await ComponentModel.updateImageById(id, blob.url);
    if (!imageUpdated) {
      throw new Error("Component image could not be updated in database.");
    }

    if (existing?.image) {
      try {
        await del(existing.image);
      } catch (error) {
        console.error("Error deleting previous blob:", error?.message ?? error);
      }
    }
  }
};

export const updateResources = async (id, data) => {
  const { figma, guidelines, cdn, storybook, figmaLink, storybookLink } = data;
  let statusUpdated = false;
  let linksUpdated = false;

  if (
    figma !== undefined ||
    guidelines !== undefined ||
    cdn !== undefined ||
    storybook !== undefined
  ) {
    await ComponentModel.updateStatusFields(id, {
      figma,
      guidelines,
      cdn,
      storybook,
    });
    statusUpdated = true;
  }

  if (figmaLink !== undefined || storybookLink !== undefined) {
    await ComponentModel.updatePlatformLinkFields(id, {
      figmaLink,
      storybookLink,
    });
    linksUpdated = true;
  }

  if (!statusUpdated && !linksUpdated) {
    throw new Error("No valid fields provided to update.");
  }

  return { statusUpdated, linksUpdated };
};

export const removeComponent = async (id) => {
  const component = await ComponentModel.findById(id);

  if (!component) {
    throw new Error("Component not found.");
  }

  const result = await ComponentModel.deleteById(id);

  // Original logic check: if (result.count === 0 && result.rowCount === 0)
  // We'll mimic this behavior, assuming the driver returns one of these properties.
  const count = result.count !== undefined ? result.count : result.rowCount;

  if (count === 0) {
    throw new Error("Component not found or could not be erased.");
  }
};
