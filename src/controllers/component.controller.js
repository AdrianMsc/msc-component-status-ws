import * as ComponentService from '../services/component.service.js';
import { put } from '@vercel/blob';
import { convertImageBufferToWebp } from '../utils/imageToWebp.js';

export const handshake = async (_, res) => {
	await res.json('👍');
};

export const getAllComponentNames = async (_, res) => {
	try {
		const components = await ComponentService.getComponentNames();
		res.json(components);
	} catch (error) {
		console.error('Error fetching components:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const getComponentCount = async (_, res) => {
	try {
		const count = await ComponentService.getComponentCount();
		res.json({ count });
	} catch (error) {
		console.error('Error counting components:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const getAllComponents = async (_, res) => {
	try {
		const result = await ComponentService.getFormattedComponents();
		res.json(result);
	} catch (error) {
		console.error('Error fetching components:', error);
		res.status(500).json({
			error: 'Internal Server Error',
			details: error.message
		});
	}
};

export const createComponent = async (req, res) => {
  const { category } = req.params;
  const { name } = req.body;

  if (!name?.trim() || !category?.trim()) {
    return res
      .status(400)
      .json({ error: "Required fields: name and category." });
  }

  try {
    const { componentId, version } = await ComponentService.createNewComponent(
      {
        ...req.body,
        category,
        imageFile: req.file,
      },
      req.user,
    );

    res.status(201).json({
      message: "Component created successfully.",
      componentId,
      version,
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
  const { name } = req.body;

  if (!name || !category || !id) {
    return res
      .status(400)
      .json({ error: "Required fields: name, category, and id." });
  }

  try {
    await ComponentService.modifyComponent(
      id,
      {
        ...req.body,
        category,
        imageFile: req.file,
      },
      req.user,
    );

    return res.status(200).json({
      message: "Component, statuses, and platform links updated successfully.",
    });
  } catch (error) {
    if (error.message === "Component not found.") {
      return res.status(404).json({ error: "Component not found." });
    }
    console.error("Error updating component:", error);
    return res.status(500).json({
      error: "An error occurred while updating the component.",
    });
  }
};

export const updateComponentResources = async (req, res) => {
  const { id } = req.params;

  try {
    const { statusUpdated, linksUpdated } =
      await ComponentService.updateResources(id, req.body, req.user);

    res.status(200).json({
      message: "Component resources updated successfully.",
      updated: {
        statuses: statusUpdated,
        links: linksUpdated,
      },
    });
  } catch (error) {
    if (error.message === "No valid fields provided to update.") {
      return res.status(400).json({
        error: error.message,
      });
    }
    console.error("Error updating component resources:", error.message);
    res.status(500).json({ error: "Error updating component resources" });
  }
};

export const uploadImage = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'Required field: image.' });
		}

		const { buffer, contentType, extension } = await convertImageBufferToWebp(req.file.buffer);
		const pathname = `uploads/${Date.now()}.${extension}`;

		const blob = await put(pathname, buffer, {
			access: 'public',
			contentType
		});

		return res.status(201).json({
			message: 'Image uploaded successfully.',
			url: blob.url,
			pathname: blob.pathname,
			contentType: blob.contentType,
			size: blob.size
		});
	} catch (error) {
		console.error('Error uploading image:', error);
		return res.status(500).json({ error: 'Error uploading image.' });
	}
};

export const deleteComponent = async (req, res) => {
  const { id } = req.params;

  try {
    await ComponentService.removeComponent(id, req.user);

    res.status(200).json({
      message: "Component, related records, and image erased successfully.",
    });
  } catch (error) {
    if (
      error.message === "Component not found." ||
      error.message === "Component not found or could not be erased."
    ) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error erasing component:", error);
    res.status(500).json({ message: "Error erasing component." });
  }
};

// ============================================
// Version Controller Functions
// ============================================

export const getComponentVersions = async (req, res) => {
  const { id } = req.params;

  try {
    const versions = await ComponentService.getVersions(id);
    res.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error.message);
    res.status(500).json({ error: "Error fetching versions" });
  }
};

export const getLatestComponentVersion = async (req, res) => {
  const { id } = req.params;

  try {
    const version = await ComponentService.getLatestVersion(id);
    if (!version) {
      return res.status(404).json({ error: "No version found for this component." });
    }
    res.json(version);
  } catch (error) {
    console.error("Error fetching latest version:", error.message);
    res.status(500).json({ error: "Error fetching latest version" });
  }
};

export const createComponentVersion = async (req, res) => {
  const { id } = req.params;
  const { version } = req.body;

  if (!version?.trim()) {
    return res.status(400).json({ error: "Required field: version." });
  }

  try {
    const versionRecord = await ComponentService.createVersion(
      Number(id),
      version,
      req.user,
    );

    res.status(201).json({
      message: "Version created successfully.",
      version: versionRecord,
    });
  } catch (error) {
    console.error("Error creating version:", error.message);
    res.status(500).json({ error: "Error creating version" });
  }
};

export const updateComponentVersion = async (req, res) => {
  const { versionId } = req.params;
  const { version } = req.body;

  if (!version?.trim()) {
    return res.status(400).json({ error: "Required field: version." });
  }

  try {
    const updated = await ComponentService.updateVersion(
      Number(versionId),
      version,
      req.user,
    );

    if (!updated) {
      return res.status(404).json({ error: "Version not found." });
    }

    res.status(200).json({
      message: "Version updated successfully.",
      version: updated,
    });
  } catch (error) {
    console.error("Error updating version:", error.message);
    res.status(500).json({ error: "Error updating version" });
  }
};

export const deleteComponentVersion = async (req, res) => {
  const { versionId } = req.params;

  try {
    await ComponentService.deleteVersion(Number(versionId), req.user);

    res.status(200).json({
      message: "Version deleted successfully.",
    });
  } catch (error) {
    if (error.message === "Version not found.") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Error deleting version:", error.message);
    res.status(500).json({ error: "Error deleting version" });
  }
};

export const setComponentLatestVersion = async (req, res) => {
  const { versionId } = req.params;

  try {
    const updated = await ComponentService.setLatestVersion(Number(versionId), req.user);

    if (!updated) {
      return res.status(404).json({ error: "Version not found." });
    }

    res.status(200).json({
      message: "Latest version updated successfully.",
      version: updated,
    });
  } catch (error) {
    console.error("Error setting latest version:", error.message);
    res.status(500).json({ error: "Error setting latest version" });
  }
};

export const getComponentById = async (req, res) => {
  const { id } = req.params;
  const { versionId } = req.query;

  try {
    const component = await ComponentService.getComponentById(
      Number(id),
      versionId ? Number(versionId) : null,
    );

    if (!component) {
      return res.status(404).json({ error: "Component not found." });
    }

    res.json(component);
  } catch (error) {
    console.error("Error fetching component:", error.message);
    res.status(500).json({ error: "Error fetching component" });
  }
};
