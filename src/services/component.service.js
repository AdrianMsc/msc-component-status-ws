import * as ComponentModel from "../models/component.model.js";
import { del, put } from "@vercel/blob";
import { convertImageBufferToWebp } from "../utils/imageToWebp.js";
import * as ActivityService from './activity.service.js';

const safeLog = (payload) => {
  ActivityService.logComponentActivity(payload).catch((error) => {
    console.error('Failed to persist component activity log:', error?.message || error);
  });
};

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

export const createNewComponent = async (data, actor) => {
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

  safeLog({
    action: 'create',
    componentId,
    actor,
    details: {
      name: data?.name,
      category: data?.category,
      atomicType: data?.atomicType ?? null,
      hasImage: Boolean(data?.imageFile)
    }
  });

  return { componentId };
};

export const modifyComponent = async (id, data, actor) => {
  const existing = await ComponentModel.findByIdWithRelations(id);

  if (!existing) {
    throw new Error("Component not found.");
  }

  const updated = await ComponentModel.update(id, {
    ...data,
  });

  if (!updated) {
    throw new Error("Component not found.");
  }

  await ComponentModel.upsertStatuses(id, data);
  await ComponentModel.upsertPlatformLinks(id, data);

  let nextImage = existing?.image ?? null;

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

    nextImage = blob.url;

    if (existing?.image) {
      try {
        await del(existing.image);
      } catch (error) {
        console.error("Error deleting previous blob:", error?.message ?? error);
      }
    }
  }

  safeLog({
    action: 'update',
    componentId: Number(id),
    actor,
    details: {
      before: {
        name: existing?.name,
        category: existing?.category,
        comment: existing?.comment,
        description: existing?.description,
        atomicType: existing?.atomic_type,
        figma: existing?.figma,
        guidelines: existing?.guidelines,
        cdn: existing?.cdn,
        storybook: existing?.storybook,
        figmaLink: existing?.figma_link,
        storybookLink: existing?.storybook_link,
        image: existing?.image
      },
      after: {
        name: data?.name,
        category: data?.category,
        comment: data?.comment,
        description: data?.description,
        atomicType: data?.atomicType ?? null,
        figma: data?.figma,
        guidelines: data?.guidelines,
        cdn: data?.cdn,
        storybook: data?.storybook,
        figmaLink: data?.figmaLink,
        storybookLink: data?.storybookLink,
        image: nextImage
      }
    }
  });
};

export const updateResources = async (id, data, actor) => {
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

  safeLog({
    action: 'update',
    componentId: Number(id),
    actor,
    details: {
      updatedResourceFields: {
        figma,
        guidelines,
        cdn,
        storybook,
        figmaLink,
        storybookLink
      }
    }
  });

  return { statusUpdated, linksUpdated };
};

export const removeComponent = async (id, actor) => {
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

  safeLog({
    action: 'delete',
    componentId: Number(id),
    actor,
    details: {
      deletedComponent: {
        id: component.id,
        name: component.name,
        category: component.category,
        atomicType: component.atomic_type
      }
    }
  });
};
